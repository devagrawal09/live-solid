"use socket";

import { createEffect, createSignal, onCleanup } from "../lib/signals";
import { createSocketFn } from "./lib/server";

function createTimer() {
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

export const createServerTimer = createSocketFn(createTimer);

function createCounter() {
  const [count, setCount] = createSignal(50);

  createEffect(count, (c) => console.log(`Count is`, c));

  return { count, setCount };
}

export const createServerCounter = createSocketFn(createCounter);
