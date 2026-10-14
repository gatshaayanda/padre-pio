import type { Metadata, Viewport } from "next";
import Script from "next/script";
import PwaRegister from "@/app/pwa-register";
import "./globals.css";
import "./pwa.css";

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL?.trim();

export const metadata: Metadata = {
  ...(baseUrl ? { metadataBase: new URL(baseUrl), alternates: { canonical: "/" } } : {}),
  title: { default: "Padre Pio Medical Centre", template: "%s | Padre Pio" },
  description: "Find Padre Pio Medical Centre in Gaborone West and request an appointment with reception.",
  applicationName: "Padre Pio",
  keywords: ["Padre Pio Medical Centre", "Gaborone West", "appointment request", "Botswana"],
  icons: {
    icon: "/padre-pio-icon.svg",
    apple: "/padre-pio-icon-192.png"
  },
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Padre Pio", statusBarStyle: "default" },
  openGraph: {
    type: "website",
    siteName: "Padre Pio Medical Centre",
    title: "Padre Pio Medical Centre",
    description: "A simpler way to reach reception and request an appointment."
  },
  twitter: {
    card: "summary",
    title: "Padre Pio Medical Centre",
    description: "Find the clinic and request an appointment."
  }
};

export const viewport: Viewport = {
  themeColor: "#21483D",
  colorScheme: "light"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <Script src="/install-capture.js" strategy="beforeInteractive" />
        <PwaRegister />
        {children}
      </body>
    </html>
  );
}