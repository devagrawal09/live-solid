import {
  createEffect,
  createAsync,
  createRenderEffect,
  createSignal,
  onCleanup,
} from "../lib/signals";
import type { WsMessageUp, WsMessageDown, SerializedRef } from "./server";

const wsPromise = new Promise<WebSocket>((resolve) => {
  const ws = new WebSocket("ws://localhost:3000/server");
  ws.onopen = () => resolve(ws);
});

const ws = createAsync(() => wsPromise);

function createRemoteSignal<T>(key: string, init?: T) {
  const [value, setValue] = createSignal<T>(init);

  createEffect(value, (v) => {
    console.log(`remote`, key, v);
  });

  createEffect(ws, (ws) => {
    const id = crypto.randomUUID();

    function handler(event) {
      const data = JSON.parse(event.data) as WsMessageDown;
      console.log(`message`, data);
      if (data.id === id) setValue(data.value);
    }

    ws.addEventListener("message", handler);
    ws.send(JSON.stringify({ type: "pull", key, id } satisfies WsMessageUp));

    onCleanup(() => {
      ws.removeEventListener("message", handler);
      ws.send(JSON.stringify({ type: "dispose", id } satisfies WsMessageUp));
    });
  });

  return value;
}

async function push<T>(key: string, value?: T) {
  const _ws = await wsPromise;

  return new Promise<T>((resolve) => {
    const id = crypto.randomUUID();
    _ws.send(
      JSON.stringify({ type: "push", key, value, id } satisfies WsMessageUp)
    );
    _ws.addEventListener("message", function (event) {
      const data = JSON.parse(event.data) as WsMessageDown;
      console.log(`message`, data);
      if (data.id === id) resolve(data.value);
    });
  });
}

function createServerCounter() {
  const promise = push<{ [key: string]: SerializedRef }>(`createCounter`);

  async function triggerSerializedRef<T>(
    key: string,
    isReactive: boolean,
    args?: any
  ) {
    const value = await promise;
    const { scope } = value[key];
    const _ws = await wsPromise;
    const id = crypto.randomUUID();

    if (!isReactive) {
      return new Promise<T>((resolve) => {
        _ws.send(
          JSON.stringify({
            type: "push",
            key,
            value,
            id,
            scope,
          } satisfies WsMessageUp)
        );
        _ws.addEventListener("message", function (event) {
          const data = JSON.parse(event.data) as WsMessageDown;
          console.log(`message`, data);
          if (data.id === id) resolve(data.value);
        });
      });
    } else {
      const [result, setResult] = createSignal<T>(undefined);
      _ws.send(
        JSON.stringify({
          type: "pull",
          key,
          value,
          id,
          scope,
        } satisfies WsMessageUp)
      );
      _ws.addEventListener("message", function (event) {
        const data = JSON.parse(event.data) as WsMessageDown;
        console.log(`message`, data);
        if (data.id === id) {
          setResult(data.value);
        }
      });
      return result;
    }
  }

  return {
    count(isReactive: boolean): number {
      triggerSerializedRef(`count`, isReactive);
      return 5;
    },
    setCount(isReactive: boolean, newCount: number) {
      triggerSerializedRef(`setCount`, isReactive, newCount);
    },
  };
}

function Counter() {
  const button = document.createElement("button");
  const rCounter = createServerCounter();

  push(`createCounter`).then((ctr) => console.log({ ctr }));

  createRenderEffect(
    () => rCounter.count(true),
    (c) => {
      button.textContent = `count is ${c}`;
    }
  );
  button.onclick = () => rCounter.setCount(false, 6);

  return [button];
}

function App() {
  const h1 = document.createElement("h1");
  const toggleButton = document.createElement("button");

  const message = createRemoteSignal<string>(`message`);

  function toggleMessage() {
    push("toggleMessage");
  }

  createEffect(message, (msg) => {
    console.log(`message signal`, msg);
  });

  createRenderEffect(message, (m) => {
    h1.textContent = m;
  });

  toggleButton.textContent = "Toggle message";
  toggleButton.onclick = () => toggleMessage();

  return [h1, ...Counter(), document.createElement("br"), toggleButton];
}

document.getElementById("root").append(...App());
