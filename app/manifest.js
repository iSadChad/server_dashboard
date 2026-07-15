export default function manifest() {
  return {
    name: "Chad's Goon Cave",
    short_name: "Goon Cave",
    description: "Personal server dashboard",
    start_url: "/tasks",
    scope: "/",
    display: "standalone",
    background_color: "#090014",
    theme_color: "#d946ef",
    icons: [
      {
        src: "/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}