import {
  createAsync,
  createEffect,
  createRenderEffect,
  createSignal,
} from "../lib/signals";

function createCounter() {
  const [count, setCount] = createSignal(50);

  createEffect(count, (c) => console.log(`Closed over count is`, c));

  return { count, setCount };
}

function createServerCounter() {
  const { count, setCount } = createCounter();

  return {
    count: async () => count(),
    setCount: async (n: number) => setCount(n),
  };
}

function Counter() {
  const button = document.createElement("button");
  const counter = createServerCounter();
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

document.getElementById("root").append(...App());
