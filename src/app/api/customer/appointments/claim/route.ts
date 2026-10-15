import { NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// When Google already belongs to a separate identity, transfer only the
// caller's verified anonymous-session requests to the account they just signed into.
export async function POST(request: Request) {
  const authorization = request.headers.get("authorization") ?? "";
  const accountToken = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
  const body = await request.json().catch(() => null) as { guestIdToken?: unknown } | null;
  const guestToken = typeof body?.guestIdToken === "string" ? body.guestIdToken : "";

  if (!accountToken || !guestToken) {
    return NextResponse.json({ error: "Both patient sessions must be verified to connect request history." }, {
      status: 401,
      headers: { "Cache-Control": "private, no-store" },
    });
  }

  try {
    const adminAuth = getAdminAuth();
    const [account, guest] = await Promise.all([
      adminAuth.verifyIdToken(accountToken),
      adminAuth.verifyIdToken(guestToken),
    ]);
    const accountProvider = account.firebase?.sign_in_provider;
    const guestProvider = guest.firebase?.sign_in_provider;

    if (account.uid === guest.uid || accountProvider !== "google.com" || guestProvider !== "anonymous") {
      return NextResponse.json({ error: "The account connection could not be verified. Your requests have not been moved." }, {
        status: 403,
        headers: { "Cache-Control": "private, no-store" },
      });
    }

    const db = getAdminDb();
    const snapshot = await db.collection("appointments").where("patientUid", "==", guest.uid).get();
    let moved = 0;
    for (let offset = 0; offset < snapshot.docs.length; offset += 400) {
      const batch = db.batch();
      const docs = snapshot.docs.slice(offset, offset + 400);
      for (const item of docs) {
        batch.update(item.ref, { patientUid: account.uid });
      }
      await batch.commit();
      moved += docs.length;
    }

    return NextResponse.json({ moved }, { headers: { "Cache-Control": "private, no-store" } });
  } catch {
    return NextResponse.json({ error: "We could not securely connect the request history. Your original request remains saved." }, {
      status: 503,
      headers: { "Cache-Control": "private, no-store" },
    });
  }
}
