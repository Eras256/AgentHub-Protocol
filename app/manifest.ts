import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "AgentHub Protocol",
    short_name: "AgentHub",
    description: "Autonomous AI agents on Avalanche",
    start_url: "/",
    display: "standalone",
    background_color: "#000000",
    theme_color: "#9333ea",
    orientation: "portrait-primary",
    icons: [
      // Optional icons - can be added later
      // {
      //   src: "/icon-192.png",
      //   sizes: "192x192",
      //   type: "image/png",
      //   purpose: "any",
      // },
      // {
      //   src: "/icon-512.png",
      //   sizes: "512x512",
      //   type: "image/png",
      //   purpose: "any",
      // },
    ],
  };
}

