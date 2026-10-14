import type { Metadata, Viewport } from "next";
import PwaRegister from "@/app/pwa-register";
import "./globals.css";
import "./pwa.css";

const siteUrl = process.env.NEXT_PUBLIC_BASE_URL;

export const metadata: Metadata = {
  metadataBase: siteUrl ? new URL(siteUrl) : undefined,
  title: {
    default: "Padre Pio Medical Centre | Digital Reception",
    template: "%s | Padre Pio Medical Centre"
  },
  description: "Find your way to Padre Pio Medical Centre in Gaborone West and request an appointment.",
  applicationName: "Padre Pio",
  alternates: siteUrl ? { canonical: "/" } : undefined,
  openGraph: {
    type: "website",
    siteName: "Padre Pio Medical Centre",
    title: "Padre Pio Medical Centre | Digital Reception",
    description: "A simpler way to find the clinic and contact reception."
  },
  twitter: {
    card: "summary",
    title: "Padre Pio Medical Centre | Digital Reception",
    description: "A simpler way to find the clinic and contact reception."
  },
  icons: {
    icon: "/padre-pio-mark.svg",
    apple: "/padre-pio-mark.svg"
  },
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Padre Pio",
    statusBarStyle: "default"
  }
};

export const viewport: Viewport = {
  themeColor: "#174C3C",
  colorScheme: "light"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <PwaRegister />
        {children}
      </body>
    </html>
  );
}
