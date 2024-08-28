import {
  createAsync,
  createEffect,
  createRenderEffect,
  createSignal,
} from "../lib/signals";

function Counter() {
  const button = document.createElement("button");
  const counter = createClientCounter();
  const count = createAsync(() => counter.count());

  createRenderEffect(
    () => count(),
    (c) => {
      button.textContent = `count is ${c}`;
    }
  );
  button.onclick = async () => await counter.setCount(count() + 1);

  return [button];
}

function App() {
  return [...Counter()];
}

function createCounter() {
  const [count, setCount] = createSignal(50);

  createEffect(count, (c) => console.log(`Closed over count is`, c));

  return { count, setCount };
}

function createClientCounter() {
  const { count, setCount } = createCounter();

  console.log(`RPC call "createCounter" and wait for the result`);

  return {
    count: async () => count(),
    setCount: async (n: number) => setCount(n),
  };
}

function createServerCounter() {
  const { count, setCount } = createCounter();

  console.log(`RPC call "createCounter" and wait for the result`);

  return {
    count: async () => count(),
    setCount: async (n: number) => setCount(n),
  };
}

document.getElementById("root").append(...App());
