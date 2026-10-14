import "server-only";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { FieldValue, getFirestore, type Firestore } from "firebase-admin/firestore";
import { createHmac } from "node:crypto";

const ADMIN_APP_NAME = "padre-pio-server";
const ALLOWED_ROLES = new Set(["owner", "staff", "doctor", "reception"]);

export function getClinicServices() {
  const projectId = process.env.FIREBASE_PROJECT_ID?.trim();
  const rawKey = process.env.FIREBASE_ADMIN_KEY;
  if (!projectId || !rawKey) throw new Error("Clinic Firebase is not configured.");
  let serviceAccount: Record<string, unknown>;
  try { serviceAccount = JSON.parse(rawKey) as Record<string, unknown>; }
  catch { throw new Error("Clinic Firebase service credentials are invalid."); }
  if (serviceAccount.project_id !== projectId || typeof serviceAccount.private_key !== "string") {
    throw new Error("Clinic Firebase project does not match its service credentials.");
  }
  const app = getApps().find(item => item.name === ADMIN_APP_NAME) ?? initializeApp({
    credential: cert(serviceAccount as Parameters<typeof cert>[0]),
    projectId
  }, ADMIN_APP_NAME);
  return { auth: getAuth(app), db: getFirestore(app), projectId, rateLimitKey: serviceAccount.private_key };
}

export async function requireClinicAdmin(request: Request): Promise<{ uid: string; role: string; db: Firestore } | null> {
  const header = request.headers.get("authorization") || "";
  if (!header.startsWith("Bearer ")) return null;
  const services = getClinicServices();
  let decoded;
  try {
    decoded = await services.auth.verifyIdToken(header.slice(7));
  } catch {
    return null;
  }
  const roleSnapshot = await services.db.collection("admins").doc(decoded.uid).get();
  const role = String(roleSnapshot.data()?.role ?? "").toLowerCase();
  if (!roleSnapshot.exists || !ALLOWED_ROLES.has(role)) return null;
  return { uid: decoded.uid, role, db: services.db };
}

export function serverTimestamp() { return FieldValue.serverTimestamp(); }
export function hashClientAddress(address: string, secret: string) {
  return createHmac("sha256", secret).update(address).digest("hex");
}
