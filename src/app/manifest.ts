import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Minka · منكا",
    short_name: "Minka",
    description: "Life areas, goals and daily habits in one planner.",
    start_url: "/today",
    display: "standalone",
    dir: "auto",
    background_color: "#F2F4F0",
    theme_color: "#0D6A4F",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
