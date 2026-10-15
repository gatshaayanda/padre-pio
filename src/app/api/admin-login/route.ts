import { createHash, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";

export const runtime = "nodejs";

// One shared access word grants the fixed reception account access.
// No separate UID or manually provisioned admins/{uid} document is required.
const RECEPTION_UID = "padre-pio-reception";

function matchesAccessWord(input: string, expected: string) {
  const actual = createHash("sha256").update(input).digest();
  const target = createHash("sha256").update(expected).digest();
  return input.length > 0 && timingSafeEqual(actual, target);
}

export async function POST(request: Request) {
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

  try {
    const adminAuth = getAdminAuth();
    try {
      await adminAuth.getUser(RECEPTION_UID);
    } catch (error) {
      if ((error as { code?: string }).code !== "auth/user-not-found") throw error;
      await adminAuth.createUser({ uid: RECEPTION_UID, displayName: "Padre Pio Reception" });
    }

    // The access word is the sole reception authorization gate. Provision the
    // fixed role only after the server has verified the correct word.
    await getAdminDb().collection("admins").doc(RECEPTION_UID).set({
      role: "owner",
      label: "Padre Pio Reception",
      updatedAt: new Date(),
    }, { merge: true });

    const token = await adminAuth.createCustomToken(RECEPTION_UID);
    return NextResponse.json({ token }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("[Padre Pio] Admin sign-in failed:", error instanceof Error ? error.message : "unknown error");
    return NextResponse.json(
      { error: "Reception sign-in is temporarily unavailable. Please check the server configuration." },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
