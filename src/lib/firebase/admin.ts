import "server-only";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

function getAdminApp() {
  const raw = process.env.FIREBASE_ADMIN_KEY;
  if (!raw) throw new Error("FIREBASE_ADMIN_KEY is not configured.");
  const account = JSON.parse(raw) as { project_id: string; client_email: string; private_key: string };
  const publicProjectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (!publicProjectId || account.project_id !== publicProjectId) {
    throw new Error("Firebase Admin credentials do not match the public clinic project.");
  }
  return getApps().find((item) => item.name === "padre-pio-server") ?? initializeApp({
    credential: cert({
      projectId: account.project_id,
      clientEmail: account.client_email,
      privateKey: account.private_key.replace(/\\n/g, "\n"),
    }),
    projectId: account.project_id,
  }, "padre-pio-server");
}

export function getAdminAuth() { return getAuth(getAdminApp()); }
export function getAdminDb() { return getFirestore(getAdminApp()); }

export async function requirePatient(request: Request) {
  const header = request.headers.get("authorization") ?? "";
  if (!header.startsWith("Bearer ")) return null;
  try {
    const decoded = await getAdminAuth().verifyIdToken(header.slice(7));
    return { uid: decoded.uid, email: decoded.email ?? null };
  } catch {
    return null;
  }
}
