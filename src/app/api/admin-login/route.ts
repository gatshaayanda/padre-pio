import { createHash, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";

export const runtime = "nodejs";

function matchesAccessWord(input: string, expected: string) {
  const actual = createHash("sha256").update(input).digest();
  const target = createHash("sha256").update(expected).digest();
  return input.length > 0 && timingSafeEqual(actual, target);
}

export async function POST(request: Request) {
  const expected = process.env.ADMIN_PASSWORD;
  const adminUid = process.env.PADRE_PIO_ADMIN_UID;
  if (!expected || !adminUid || !process.env.FIREBASE_ADMIN_KEY) {
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
    const admin = await getAdminDb().collection("admins").doc(adminUid).get();
    if (!admin.exists || !["owner", "staff"].includes(String(admin.data()?.role ?? ""))) {
      return NextResponse.json(
        { error: "This access account is not provisioned for Padre Pio reception." },
        { status: 403, headers: { "Cache-Control": "no-store" } },
      );
    }
    const token = await getAdminAuth().createCustomToken(adminUid);
    return NextResponse.json({ token }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("[Padre Pio] Admin sign-in failed:", error instanceof Error ? error.message : "unknown error");
    return NextResponse.json(
      { error: "Reception sign-in is temporarily unavailable. Please check the server configuration." },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
