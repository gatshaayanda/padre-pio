import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import type { Firestore } from "firebase-admin/firestore";
import { getClinicServices, hashClientAddress, requireClinicAdmin, serverTimestamp } from "@/lib/server/firebase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const CATEGORIES = new Set(["appointment", "follow-up", "not-sure"]);
const STATUSES = new Set(["NEW", "REVIEWING", "APPROVED", "CONFIRMED", "RESCHEDULE_REQUESTED", "COMPLETED", "CANCELLED"]);
const TRANSITIONS: Record<string, string[]> = {
  NEW: ["REVIEWING", "CANCELLED"],
  REVIEWING: ["APPROVED", "RESCHEDULE_REQUESTED", "CANCELLED"],
  APPROVED: ["CONFIRMED", "RESCHEDULE_REQUESTED", "CANCELLED"],
  CONFIRMED: ["COMPLETED", "RESCHEDULE_REQUESTED", "CANCELLED"],
  RESCHEDULE_REQUESTED: ["REVIEWING", "APPROVED", "CONFIRMED", "CANCELLED"],
  COMPLETED: ["REVIEWING"],
  CANCELLED: ["REVIEWING"]
};
function fail(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status, headers: { "Cache-Control": "no-store" } });
}
function text(value: unknown, max: number) {
  return typeof value === "string" ? value.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, max) : "";
}
function validDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(value + "T12:00:00Z");
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value) return false;
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Gaborone", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  const part = (type: string) => parts.find(item => item.type === type)?.value ?? "";
  const today = part("year") + "-" + part("month") + "-" + part("day");
  const max = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  return value >= today && value <= max;
}
function makeReference() {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Gaborone", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  const part = (type: string) => parts.find(item => item.type === type)?.value ?? "";
  return "PP-" + part("year") + part("month") + part("day") + "-" + randomBytes(2).toString("hex").toUpperCase();
}
function clientAddress(request: Request) {
  const trusted = request.headers.get("x-real-ip")?.trim();
  const forwarded = request.headers.get("x-forwarded-for") || "";
  return (trusted || forwarded.split(",").at(-1)?.trim() || "unknown").slice(0, 128);
}
async function consumeRateLimit(db: Firestore, address: string, secret: string) {
  const ref = db.collection("appointmentRateLimits").doc(hashClientAddress(address, secret));
  const now = Date.now();
  const allowed = await db.runTransaction(async tx => {
    const snap = await tx.get(ref);
    const data = snap.data() ?? {};
    const started = typeof data.windowStartedAt === "number" ? data.windowStartedAt : 0;
    const count = typeof data.count === "number" ? data.count : 0;
    if (snap.exists && now - started < 15 * 60 * 1000 && count >= 4) return false;
    const active = snap.exists && now - started < 15 * 60 * 1000;
    tx.set(ref, { count: active ? count + 1 : 1, windowStartedAt: active ? started : now, expiresAt: new Date(now + 24 * 60 * 60 * 1000) });
    return true;
  });
  const expired = await db.collection("appointmentRateLimits").where("expiresAt", "<", new Date(now)).limit(2).get().catch(() => null);
  if (expired) await Promise.all(expired.docs.map(item => item.ref.delete().catch(() => undefined)));
  return allowed;
}

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get("content-length") || "0");
  if (Number.isFinite(contentLength) && contentLength > 8192) return fail("The form is too large.", 413);
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (!body) return fail("Please check the form and try again.");
  if (text(body.website, 200)) return fail("Please check the form and try again.");
  const requestId = text(body.requestId, 64);
  const name = text(body.name, 80);
  const phone = text(body.phone, 24);
  const preferredDate = text(body.preferredDate, 10);
  const preferredTime = text(body.preferredTime, 5);
  const category = text(body.category, 24);
  const note = text(body.note, 300);
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(requestId)) return fail("Please refresh the page and try again.");
  if (name.length < 2 || !/^[+()\d\s.-]{7,24}$/.test(phone) || !validDate(preferredDate) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(preferredTime) || !CATEGORIES.has(category) || body.privacyConsent !== true) {
    return fail("Please check your name, phone number, preferred date and time, appointment type, and consent.");
  }
  try {
    const services = getClinicServices();
    const allowed = await consumeRateLimit(services.db, clientAddress(request), services.rateLimitKey);
    if (!allowed) return fail("We have received several requests from this connection. Please wait a little before trying again, or call reception.", 429);
    const docRef = services.db.collection("appointments").doc(requestId);
    const eventRef = services.db.collection("appointmentEvents").doc(requestId + "-created");
    const result = await services.db.runTransaction(async tx => {
      const existing = await tx.get(docRef);
      if (existing.exists) return { reference: String(existing.data()?.reference || ""), duplicate: true };
      const reference = makeReference();
      tx.create(docRef, { reference, name, phone, preferredDate, preferredTime, category, note, privacyConsent: true, privacyNoticeVersion: "2026-10-14", privacyConsentAt: serverTimestamp(), status: "NEW", createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
      tx.create(eventRef, { appointmentId: requestId, reference, action: "REQUEST_CREATED", fromStatus: null, toStatus: "NEW", actorUid: null, createdAt: serverTimestamp() });
      return { reference, duplicate: false };
    });
    if (!result.reference) return fail("Your request could not be confirmed. Please try again.", 503);
    return NextResponse.json(result, { status: result.duplicate ? 200 : 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Appointment request could not be stored.", error instanceof Error ? error.message : "unknown error");
    return fail("Appointment requests are temporarily unavailable. Please call reception and try again later.", 503);
  }
}

export async function GET(request: Request) {
  try {
    const admin = await requireClinicAdmin(request);
    if (!admin) return fail("Staff access is required.", 401);
    const snapshot = await admin.db.collection("appointments").orderBy("createdAt", "desc").limit(100).get();
    const appointments = snapshot.docs.map(item => {
      const data = item.data();
      return { id: item.id, reference: data.reference, name: data.name, phone: data.phone, preferredDate: data.preferredDate, preferredTime: data.preferredTime, category: data.category, note: data.note, status: data.status, adminNote: data.adminNote || "", createdAt: data.createdAt?.toDate?.().toISOString?.() || null };
    });
    return NextResponse.json({ appointments }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Appointment queue could not be loaded.", error instanceof Error ? error.message : "unknown error");
    return fail("The appointment queue is temporarily unavailable.", 503);
  }
}

export async function PATCH(request: Request) {
  const contentLength = Number(request.headers.get("content-length") || "0");
  if (Number.isFinite(contentLength) && contentLength > 4096) return fail("The update is too large.", 413);
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (!body) return fail("Please check the update and try again.");
  const id = text(body.id, 64);
  const status = text(body.status, 32);
  const adminNote = text(body.adminNote, 1000);
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id) || !STATUSES.has(status)) return fail("This appointment update is not valid.");
  try {
    const admin = await requireClinicAdmin(request);
    if (!admin) return fail("Staff access is required.", 401);
    const docRef = admin.db.collection("appointments").doc(id);
    const eventRef = admin.db.collection("appointmentEvents").doc();
    const result = await admin.db.runTransaction(async tx => {
      const snap = await tx.get(docRef);
      if (!snap.exists) return { error: "not-found" as const };
      const previous = String(snap.data()?.status || "NEW");
      if (previous !== status && !(TRANSITIONS[previous] || []).includes(status)) return { error: "transition" as const, previous };
      tx.update(docRef, { status, adminNote, updatedAt: serverTimestamp(), updatedBy: admin.uid });
      tx.create(eventRef, { appointmentId: id, reference: snap.data()?.reference || "", action: previous === status ? "ADMIN_NOTE_UPDATED" : "STATUS_CHANGED", fromStatus: previous, toStatus: status, adminNote, actorUid: admin.uid, createdAt: serverTimestamp() });
      return { previous, status };
    });
    if ("error" in result && result.error === "not-found") return fail("This appointment could not be found.", 404);
    if ("error" in result && result.error === "transition") return fail("That status change is not allowed from " + result.previous + ".", 409);
    return NextResponse.json({ success: true, status }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Appointment update could not be saved.", error instanceof Error ? error.message : "unknown error");
    return fail("The update could not be saved. Please try again.", 503);
  }
}
