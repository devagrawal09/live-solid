import { createEffect, createSignal, onCleanup } from "../lib/signals";

export function createTimer() {
  "use socket";
  const [timer, setTimer] = createSignal(10);

  console.log(`setting up timer`);

  const interval = setInterval(() => {
    console.log(`triggering timer`, timer());
    setTimer(timer() + 1);
  }, 1000);

  onCleanup(() => {
    console.log(`cleaning up timer`);
    clearInterval(interval);
  });

  return timer;
}
export function createCounter() {
  const [count, setCount] = createSignal(50);

  createEffect(count, (c) => console.log(`Count is`, c));

  return { count, setCount };
}
