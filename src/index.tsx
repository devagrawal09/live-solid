import { Observable } from "rxjs";
import { createRenderEffect } from "../lib/signals";
import { createEndpoint, type SocketRef } from "./lib/client";
import { from } from "./lib/shared";

function Counter() {
  const button = document.createElement("button");
  const serverCounter = createEndpoint(`createCounter`) as ServerCounter;
  const count = from(serverCounter.count() as Observable<number>);

  createRenderEffect(count, (c) => {
    button.textContent = `count is ${c}`;
  });
  button.onclick = async () => await serverCounter.setCount(count() + 1, false);

  return [button];
}

function Timer() {
  const span = document.createElement("span");
  const serverTimer = createServerTimer();
  const timer = from(serverTimer() as Observable<number>);

  createRenderEffect(timer, (t) => {
    span.textContent = `timer is ${t}`;
  });

  return [span];
}

function App() {
  return [...Counter(), ...Timer()];
}

type ServerCounter = {
  count: SocketRef<void, number>;
  setCount: SocketRef<number, number>;
};

function createServerCounter() {
  return createEndpoint(`createCounter`) as ServerCounter;
}

function createServerTimer() {
  return createEndpoint(`createTimer`) as SocketRef<void, number>;
}

document.getElementById("root").append(...App());
