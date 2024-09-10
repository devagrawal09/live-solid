import { createAsync, createRenderEffect } from "../lib/signals";
import { createTimer, createCounter } from "./server";

function Counter() {
  const serverCounter = createCounter();
  const count = createAsync(() => serverCounter.count());

  const button = document.createElement("button");
  createRenderEffect(count, (c) => {
    button.textContent = `count is ${c}`;
  });
  button.onclick = () => serverCounter.setCount(count() + 1);

  return [button];
}

function Timer() {
  const serverTimer = createTimer();

  const timer = createAsync(() => serverTimer());

  const span = document.createElement("span");
  createRenderEffect(timer, (t) => {
    span.textContent = `timer is ${t}`;
  });

  return [span];
}

function App() {
  return [...Counter(), ...Timer()];
}

document.getElementById("root").append(...App());
