import { createApp } from "vinxi";

export default createApp({
  server: {
    experimental: { websocket: true },
  },
  routers: [
    {
      name: "client",
      type: "spa",
      handler: "./index.html",
    },
    {
      name: "server",
      type: "http",
      handler: "./src/server.tsx",
      base: "/server",
    },
  ],
});
