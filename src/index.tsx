import { createRenderEffect } from "../lib/signals";
import { createCounter, createTimer } from "./server";

function Counter() {
  const button = document.createElement("button");
  const { count, setCount } = createCounter();

  createRenderEffect(count, (c) => {
    button.textContent = `count is ${c}`;
  });
  button.onclick = async () => setCount(count() + 1);

  return [button];
}

function Timer() {
  const span = document.createElement("span");

  const timer = createTimer()();
  console.log({ timer });

  createRenderEffect(timer, (t) => {
    span.textContent = `timer is ${t}`;
  });

  return [span];
}

function App() {
  return [...Counter(), ...Timer()];
}

document.getElementById("root").append(...App());
