import { createEffect, createRenderEffect, createSignal } from "../lib/signals";

function Counter() {
  const h1 = document.createElement("h1");
  const button = document.createElement("button");
  const toggleButton = document.createElement("button");

  const [message, setMessage] = createSignal(`Hello from typescript`);
  const [count, setCount] = createSignal(0);

  createEffect(message, (msg) => {
    console.log(`message`, msg);
  });

  createRenderEffect(message, (m) => {
    h1.textContent = m;
  });

  createRenderEffect(count, (c) => {
    button.textContent = `count is ${c}`;
  });
  button.onclick = () => setCount(count() + 1);

  toggleButton.textContent = "Toggle message";
  toggleButton.onclick = () =>
    setMessage((m) =>
      m === "Hello from typescript" ? "Hello world" : "Hello from typescript"
    );

  return [h1, button, document.createElement("br"), toggleButton];
}

document.getElementById("root").append(...Counter());
