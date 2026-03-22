import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "MOE - ELEARN",
    short_name: "MOE eLearn",
    description: "Your gateway to quality education.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#059669",
    icons: [
      {
        src: "/moe.png",
        sizes: "128x128",
        type: "image/png",
      },
    ],
  };
}
