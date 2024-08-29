import { from as rxFrom, mergeMap, Observable } from "rxjs";
import {
  from as solidFrom,
  SerializedRef,
  WsMessage,
  WsMessageDown,
  WsMessageUp,
} from "./shared";
import { Accessor, onCleanup } from "../../lib/signals";

const globalWsPromise = new Promise<SimpleWs>((resolve) => {
  const ws = new WebSocket("ws://localhost:3000/_server");
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

  return rxFrom(Promise.resolve(wsPromise)).pipe(
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

export type SocketRef<I, O> = (
  input?: I,
  isListening?: boolean
) => Accessor<O> | Promise<O>;

export function exposeRef<I, O>(
  scopePromise: Promise<SerializedRef | Record<string, SerializedRef>>,
  wsPromise: Promise<SimpleWs>,
  key?: string
) {
  // console.log(`exposeRef`, key, scopePromise);
  const ref: SocketRef<I, O> = (input, isListening = true) => {
    if (isListening) {
      const $ = rxFrom(scopePromise).pipe(
        mergeMap((scope) => {
          // console.log(`exposeRef 2`, { key, scope });

          return wsSub<O>(
            {
              type: "subscribe",
              ref: key ? scope[key] : scope,
              input,
            },
            wsPromise
          );
        })
      );
      return solidFrom($);
    } else {
      return scopePromise.then((scope) => {
        // console.log(`exposeRef 3`, key);
        return wsRpc<O>(
          {
            type: "invoke",
            ref: key ? scope[key] : scope,
            input,
          },
          wsPromise
        ).then(({ value }) => value);
      });
    }
  };

  return ref;
}

export function createEndpoint<
  T extends SerializedRef | Record<string, SerializedRef>
>(name: string, keys: string[] = [], wsPromise = globalWsPromise) {
  // console.log(`endpoint ${name} created with`);
  const scopePromise = wsRpc<T>({ type: "create", name }, wsPromise);
  const scopeValue = scopePromise.then(({ value }) => {
    // console.log(`endpoint ${name} resolved with`, value);
    return value;
  });

  onCleanup(() => {
    scopePromise.then(({ dispose }) => dispose());
  });

  if (keys.length) {
    return keys.reduce((acc, key) => {
      return { ...acc, [key]: exposeRef(scopeValue, wsPromise, key) };
    }, {} as Record<string, SocketRef<any, any>>);
  } else {
    // console.log(`name`, name, `direct callable`);
    return exposeRef(scopeValue, wsPromise);
  }
}
