import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Padre Pio Medical Centre | Digital Reception",
    short_name: "Padre Pio",
    description: "Find your way to Padre Pio Medical Centre and request an appointment.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#F8F5EC",
    theme_color: "#174C3C",
    orientation: "portrait-primary",
    lang: "en",
    categories: ["medical", "health"],
    prefer_related_applications: false,
    icons: [
      { src: "/padre-pio-mark.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }
    ]
  };
}
