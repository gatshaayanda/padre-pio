import { createHash, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";

export const runtime = "nodejs";

// One shared access word grants the fixed reception account access.
const RECEPTION_UID = "padre-pio-reception";

function matchesAccessWord(input: string, expected: string) {
  const actual = createHash("sha256").update(input).digest();
  const target = createHash("sha256").update(expected).digest();
  return input.length > 0 && timingSafeEqual(actual, target);
}

export async function POST(request: Request) {
  try {
    const expected = process.env.ADMIN_PASSWORD;
    if (!expected || !process.env.FIREBASE_ADMIN_KEY) {
      return NextResponse.json(
        { error: "Reception access is not configured yet. The clinic administrator must complete the server setup." },
        { status: 503, headers: { "Cache-Control": "no-store" } },
      );
    }

    const body = await request.json().catch(() => null) as { word?: unknown } | null;
    const word = typeof body?.word === "string" ? body.word : "";
    if (!matchesAccessWord(word, expected)) {
      return NextResponse.json(
        { error: "Access denied. Check the access word and try again." },
        { status: 401, headers: { "Cache-Control": "no-store" } },
      );
    }

    // Match the established Tripple S one-word flow: create the staff role
    // only after the correct access word is verified, then issue a custom
    // token for Firebase Auth to sign in. No getUser/createUser round-trip.
    const db = getAdminDb();
    const adminRef = db.collection("admins").doc(RECEPTION_UID);
    const existing = await adminRef.get();
    if (!existing.exists) {
      await adminRef.set({ role: "owner", accessMethod: "one-word-admin" });
    } else if (!["owner", "staff"].includes(String(existing.data()?.role ?? ""))) {
      return NextResponse.json(
        { error: "This access account is not authorized for Padre Pio Reception." },
        { status: 403, headers: { "Cache-Control": "no-store" } },
      );
    }

    const token = await getAdminAuth().createCustomToken(RECEPTION_UID);
    return NextResponse.json({ token }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("[Padre Pio] Admin sign-in failed:", error instanceof Error ? error.message : "unknown error");
    return NextResponse.json(
      { error: "Reception sign-in is temporarily unavailable. Please check the server configuration." },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
