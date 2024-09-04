import { createAsync, createRenderEffect } from "../lib/signals";
import { createServerTimer, createServerCounter } from "./server";

function Counter() {
  const button = document.createElement("button");
  const serverCounter = createServerCounter();
  const count = createAsync(() => serverCounter.count());

  createRenderEffect(count, (c) => {
    button.textContent = `count is ${c}`;
  });
  button.onclick = async () => await serverCounter.setCount(count() + 1);

  return [button];
}

function Timer() {
  const span = document.createElement("span");

  const serverTimer = createServerTimer();

  const timer = createAsync(() => serverTimer());

  createRenderEffect(timer, (t) => {
    span.textContent = `timer is ${t}`;
  });

  return [span];
}

function App() {
  return [...Counter(), ...Timer()];
}

document.getElementById("root").append(...App());
