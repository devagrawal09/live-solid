import { createApp } from "vinxi";
import { fileURLToPath } from "url";
import { normalize } from "vinxi/lib/path";
import { client } from "./src/plugin/client";
import { server } from "./src/plugin/server";

export default createApp({
  server: {
    experimental: { websocket: true },
  },
  routers: [
    {
      name: "client",
      type: "spa",
      handler: "./index.html",
      plugins: () => [
        client({
          runtime: normalize(
            fileURLToPath(
              new URL("./src/plugin/client-runtime.ts", import.meta.url)
            )
          ),
        }),
      ],
    },
    {
      name: "server",
      type: "http",
      handler: "./src/server.tsx",
      base: "/server",
    },
    {
      name: "socket-fns",
      type: "http",
      base: "/_server",
      handler: "./src/plugin/server-handler.ts",
      target: "server",
      plugins: () => [
        server({
          runtime: normalize(
            fileURLToPath(
              new URL("./src/plugin/server-runtime.js", import.meta.url)
            )
          ),
        }),
      ],
    },
  ],
});
