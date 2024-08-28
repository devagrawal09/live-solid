import { createEffect, createSignal, onCleanup } from "../lib/signals";
import { serverHandler } from "./lib/server";

function createCounter() {
  const [count, setCount] = createSignal(50);

  createEffect(count, (c) => console.log(`Closed over count is`, c));

  return { count, setCount };
}

function createTimer() {
  const [timer, setTimer] = createSignal(10);

  const timeout = setTimeout(() => setTimer(timer() + 1), 1000);

  onCleanup(() => clearTimeout(timeout));

  return timer;
}

export default serverHandler({ createCounter, createTimer });
