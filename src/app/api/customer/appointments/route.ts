import { NextResponse } from "next/server";
import { getAdminDb, requirePatient } from "@/lib/firebase/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const patient = await requirePatient(request);
  if (!patient) {
    return NextResponse.json({ error: "Open your patient account to view your request history." }, {
      status: 401,
      headers: { "Cache-Control": "private, no-store" },
    });
  }

  try {
    const snapshot = await getAdminDb()
      .collection("appointments")
      .where("patientUid", "==", patient.uid)
      .get();

    const items = snapshot.docs.map((document) => {
      const data = document.data();
      const created = data.createdAt && typeof data.createdAt.toDate === "function"
        ? data.createdAt.toDate().toISOString()
        : "";
      return {
        id: document.id,
        reference: document.id,
        createdAt: created,
        preferredDate: String(data.preferredDate ?? ""),
        preferredTime: String(data.preferredTime ?? ""),
        category: String(data.category ?? "NOT_SURE"),
        status: String(data.status ?? "NEW"),
      };
    }).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 50);

    return NextResponse.json({ items }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("[Padre Pio] Patient appointment history unavailable:", error instanceof Error ? error.message : "unknown error");
    return NextResponse.json({ error: "Your request history is temporarily unavailable. Please try again." }, {
      status: 503,
      headers: { "Cache-Control": "private, no-store" },
    });
  }
}
