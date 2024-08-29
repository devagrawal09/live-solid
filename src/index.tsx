import { Observable } from "rxjs";
import { createRenderEffect } from "../lib/signals";
import { createEndpoint, type SocketRef } from "./lib/client";
import { from, type SerializedRef } from "./lib/shared";

function Counter() {
  const button = document.createElement("button");
  const serverCounter = createEndpoint(`createCounter`, [`count`, `setCount`]);
  const count = from(serverCounter.count(null, true));

  createRenderEffect(count, (c) => {
    button.textContent = `count is ${c}`;
  });
  button.onclick = async () => await serverCounter.setCount(count() + 1, false);

  return [button];
}

function Timer() {
  const span = document.createElement("span");
  const serverTimer = createServerTimer();
  const timer$ = serverTimer(null, true) as Observable<number>;
  console.log(`timer$`, timer$);
  const timer = from(timer$);

  createRenderEffect(
    () => timer(),
    (t) => {
      span.textContent = `timer is ${t}`;
    }
  );

  return [span];
}

function App() {
  return [...Counter(), ...Timer()];
}

type ServerCounter = {
  count: SerializedRef<void, number>;
  setCount: SerializedRef<number, number>;
};

type ClientCounter = {
  count: SocketRef<void, number>;
  setCount: SocketRef<number, number>;
};

function createServerCounter() {
  return createEndpoint<ServerCounter>(`createCounter`, [
    `count`,
    `setCount`,
  ]) as ClientCounter;
}

function createServerTimer() {
  return createEndpoint<SerializedRef<void, number>>(
    `createTimer`
  ) as SocketRef<void, number>;
}

document.getElementById("root").append(...App());
