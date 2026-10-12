import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { createUploadthing, type FileRouter } from "uploadthing/next";

const f = createUploadthing();

function getAdminApp() {
  const existing = getApps()[0];
  if (existing) return existing;
  const raw = process.env.FIREBASE_ADMIN_KEY;
  if (!raw) throw new Error("The sourcing upload service is not configured.");
  let serviceAccount: Record<string, unknown>;
  try {
    serviceAccount = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    throw new Error("The sourcing upload credentials are invalid.");
  }
  return initializeApp({ credential: cert(serviceAccount as Parameters<typeof cert>[0]) });
}

export const ourFileRouter = {
  fileUploader: f({
    image: { maxFileSize: "4MB", maxFileCount: 1 },
    pdf: { maxFileSize: "4MB", maxFileCount: 1 },
  })
    .middleware(async ({ req }) => {
      const match = (req.headers.get("authorization") || "").match(/^Bearer\s+(.+)$/i);
      if (!match) throw new Error("Sign in to The Plug before uploading a request attachment.");
      const decoded = await getAuth(getAdminApp()).verifyIdToken(match[1]);
      return { uid: decoded.uid };
    })
    .onUploadComplete(async ({ file, metadata }) => {
      console.info("[The Plug] sourcing attachment uploaded", {
        uid: metadata.uid,
        name: file.name,
        size: file.size,
        type: file.type,
        urlAvailable: Boolean(file.url || file.ufsUrl),
      });
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
