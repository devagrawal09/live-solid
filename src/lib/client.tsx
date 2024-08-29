import { from, mergeMap, Observable } from "rxjs";
import { SerializedRef, WsMessage, WsMessageDown, WsMessageUp } from "./shared";
import { onCleanup } from "../../lib/signals";

const globalWsPromise = new Promise<SimpleWs>((resolve) => {
  const ws = new WebSocket("ws://localhost:3000/server");
  ws.onopen = () => resolve(ws);
});

export type Listener = (ev: { data: any }) => any;
export type SimpleWs = {
  removeEventListener(type: "message", listener: Listener): void;
  addEventListener(type: "message", listener: Listener): void;
  send(data: string): void;
};

function wsRpc<T>(message: WsMessageUp, wsPromise: Promise<SimpleWs>) {
  const id = crypto.randomUUID() as string;

  return new Promise<{ value: T; dispose: () => void }>(async (res, rej) => {
    const ws = await wsPromise;

    function dispose() {
      ws.send(
        JSON.stringify({ type: "dispose", id } satisfies WsMessage<WsMessageUp>)
      );
    }

    function handler(event: MessageEvent) {
      // console.log(`handler ${id}`, message, { data: event.data });
      const data = JSON.parse(event.data) as WsMessage<WsMessageDown<T>>;
      if (data.id === id) {
        res({ value: data.value, dispose });
        ws.removeEventListener("message", handler);
      }
    }

    ws.addEventListener("message", handler);
    ws.send(
      JSON.stringify({ ...message, id } satisfies WsMessage<WsMessageUp>)
    );
  });
}

function wsSub<T>(message: WsMessageUp, wsPromise: Promise<SimpleWs>) {
  const id = crypto.randomUUID();

  return from(Promise.resolve(wsPromise)).pipe(
    mergeMap((ws) => {
      // console.log(`wsSub`, message);
      return new Observable<T>((obs) => {
        function handler(event: MessageEvent) {
          const data = JSON.parse(event.data) as WsMessage<WsMessageDown<T>>;
          // console.log({ data });
          if (data.id === id) obs.next(data.value);
        }

        ws.addEventListener("message", handler);
        ws.send(
          JSON.stringify({ ...message, id } satisfies WsMessage<WsMessageUp>)
        );

        return () => ws.removeEventListener("message", handler);
      });
    })
  );
}

export type SocketRef<I = any, O = any> = (
  input?: I,
  isListening?: boolean
) => Observable<O> | Promise<O>;

export function exposeRef<I, O>(
  refPromise: Promise<SerializedRef>,
  wsPromise: Promise<SimpleWs>
) {
  // console.log(`exposeRef`, refPromise);
  const ref: SocketRef<I, O> = (input, isListening = true) => {
    if (isListening) {
      return from(refPromise).pipe(
        mergeMap((ref) => {
          // console.log(`exposeRef 2`, { ref });

          return wsSub<O>(
            {
              type: "subscribe",
              ref,
              input,
            },
            wsPromise
          );
        })
      );
    } else {
      return refPromise.then((ref) => {
        // console.log(`exposeRef 3`, ref);
        return wsRpc<O>(
          {
            type: "invoke",
            ref,
            input,
          },
          wsPromise
        ).then(({ value }) => value);
      });
    }
  };

  return ref;
}

function assertRef(ref: any): SerializedRef {
  if (ref.__type === "ref") return ref;
  throw new Error(`not a ref`);
}

export function createEndpoint(name: string, wsPromise = globalWsPromise) {
  // console.log(`endpoint ${name} created with`);
  const scopePromise = wsRpc<SerializedRef | Record<string, SerializedRef>>(
    { type: "create", name },
    wsPromise
  );
  const scopeValue = scopePromise.then(({ value }) => {
    // console.log(`endpoint ${name} resolved with`, value);
    return value;
  });

  onCleanup(() => {
    scopePromise.then(({ dispose }) => dispose());
  });

  return new Proxy<SocketRef | Record<string, SocketRef>>((() => {}) as any, {
    apply(_, __, args) {
      const refPromise = scopeValue.then(assertRef);
      return exposeRef(refPromise, wsPromise)(args[0], args[1]);
    },
    get(_, path) {
      const refPromise = scopeValue.then((callables) =>
        assertRef(callables[path])
      );
      return exposeRef(refPromise, wsPromise);
    },
  });
}
