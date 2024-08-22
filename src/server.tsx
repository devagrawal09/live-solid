import { createEffect, createSignal } from "../lib/signals";
import { serverHandler } from "./lib/server";

function createCounter() {
  const [count, setCount] = createSignal(50);

  createEffect(count, (c) => console.log(`Closed over count is`, c));

  return { count, setCount };
}

export default serverHandler({ createCounter });
