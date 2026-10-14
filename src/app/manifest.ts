import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Padre Pio Medical Centre",
    short_name: "Padre Pio",
    description: "Find the clinic, request an appointment, and hear back from reception.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#F7F4EC",
    theme_color: "#21483D",
    orientation: "portrait-primary",
    lang: "en",
    categories: ["health", "medical"],
    prefer_related_applications: false,
    icons: [
      { src: "/padre-pio-icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/padre-pio-icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/padre-pio-icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }
    ],
    shortcuts: [
      {
        name: "Request an appointment",
        short_name: "Appointment",
        description: "Send an appointment request to reception",
        url: "/#request-appointment",
        icons: [{ src: "/padre-pio-icon-192.png", sizes: "192x192", type: "image/png" }]
      }
    ]
  };
}