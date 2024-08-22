import { type Peer } from "crossws";
import { eventHandler } from "vinxi/http";
import {
  Accessor,
  createEffect,
  createRoot,
  createSignal,
  getOwner,
  onCleanup,
} from "../lib/signals";
import { Observable } from "rxjs";

console.log(`\n\n********RUNNING SERVER***********\n\n`);

export function observable<T>(input: Accessor<T>): Observable<T> {
  return new Observable((observer) => {
    const dispose = createRoot((disposer) => {
      createEffect(input, (v) => observer.next(v));
      return disposer;
    });

    if (getOwner()) onCleanup(dispose);

    return () => dispose();
  });
}

export type WsMessageUp =
  | {
      type: "pull";
      scope?: string;
      key: string;
      value?: any;
      id: string;
    }
  | {
      type: "dispose";
      id: string;
    }
  | {
      type: "push";
      scope?: string;
      key: string;
      value?: any;
      id: string;
    };

export type WsMessageDown = {
  id: string;
  value: any;
};

type MessageUp = {
  peer: string;
  id: string;
  key: string;
  value?: any;
};

const [count, setCount] = createSignal(10);
const [message, setMessage] = createSignal(`Hello from typescript`);
function toggleMessage() {
  setMessage((m) =>
    m === "Hello from typescript" ? "Hello world" : "Hello from typescript"
  );
}

function createCounter() {
  const [count, setCount] = createSignal(50);
  createEffect(count, (c) => console.log(`Closed over count is`, c));
  return { count, setCount };
}

export type SerializedRef = {
  __type: "ref";
  key: string;
  scope: string;
};
function createSeriazliedRef(
  opts: Omit<SerializedRef, "__type">
): SerializedRef {
  return { ...opts, __type: "ref" };
}

createEffect(count, (c) => {
  console.log(`count`, c);
});

type ExposedRef =
  | Observable<unknown>
  | ((arg?: unknown) => Promise<unknown> | Observable<unknown> | unknown);

const exposed: Record<
  string,
  | Observable<unknown>
  | ((arg?: unknown) => Promise<unknown> | Observable<unknown> | unknown)
> = {
  count: observable(count),
  setCount,
  message,
  toggleMessage,
  createCounter,
};

// const mapped = mapArray(subs, (sub) => {
//   const signal = exposed[sub.key];

//   console.log(`mapping sub`, sub);

//   createEffect(signal, (value) => {
//     const peer = peers().find((p) => p.id === sub.peer);
//     console.log(`pushing ${sub.key} = ${value} to ${sub.peer}`, { peer });

//     if (!peer)
//       setSubs(
//         subs().filter((m) => !(m.peer === sub.peer && m.key === sub.key))
//       );
//     else
//       peer.send(
//         JSON.stringify({
//           id: sub.id,
//           value,
//         } satisfies WsMessageDown)
//       );
//   });
// });

const mapp = new Map<string, LiveClient>();

class LiveClient {
  private closures = new Map<string, any>();

  constructor(public peer: Peer) {}

  pull({
    scope,
    key,
    value,
    id,
  }: {
    scope?: string;
    key: string;
    value?: any;
    id: string;
  }) {}

  dispose(id: string) {}

  push({
    scope,
    key,
    value,
    id,
  }: {
    scope?: string;
    key: string;
    value?: any;
    id: string;
  }) {
    const result = exposed[key](value);
    console.log({ id, key, result });
    const payload =
      result &&
      Object.entries(exposed[key](value)).reduce((res, [name, value]) => {
        return {
          ...res,
          [name]:
            typeof value === "function"
              ? createSeriazliedRef({ key: name, scope: id })
              : value,
        };
      }, {});
    this.peer.send(
      JSON.stringify({
        id: id,
        value: payload,
      } satisfies WsMessageDown)
    );
  }

  async cleanup() {}
}

export default eventHandler({
  handler() {},
  websocket: {
    open(peer) {
      mapp.set(peer.id, new LiveClient(peer));
    },
    message(peer, e) {
      const message = JSON.parse(e.text()) as WsMessageUp;
      console.log(`message`, { peer, ...message });

      const client = mapp.get(peer.id);

      if (message.type === "pull") {
        client?.pull(message);
      } else if (message.type === "dispose") {
        client?.dispose(message.id);
      } else if (message.type === "push") {
        client.push(message);
      }
    },
    async close(peer) {
      const client = mapp.get(peer.id);
      await client.cleanup();
      mapp.delete(peer.id);
    },
  },
});
