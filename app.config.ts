import { createApp } from "vinxi";

export default createApp({
  routers: [
    {
      name: "client",
      type: "spa",
      handler: "./index.html",
    },
  ],
});
