import { Observable } from "rxjs";
import {
  type Accessor,
  createRoot,
  createEffect,
  getOwner,
  onCleanup,
  createSignal,
} from "../../lib/signals";

export function observable<T>(input: Accessor<T>) {
  return new Observable<T>((observer) => {
    const dispose = createRoot((disposer) => {
      createEffect(input, (v) => observer.next(v));
      return disposer;
    });

    if (getOwner()) onCleanup(dispose);

    return () => dispose();
  });
}

export function observableRoot<I, O>(input: I, fn: (arg: I) => O) {
  return new Observable<O>((observer) => {
    const dispose = createRoot((disposer) => {
      observer.next(fn(input));
      return disposer;
    });

    if (getOwner()) onCleanup(dispose);

    return () => dispose();
  });
}

export function from<T>(producer: {
  subscribe: (fn: (v: T) => void) => { unsubscribe: () => void };
}): Accessor<T | undefined> {
  const [s, set] = createSignal<T | undefined>(undefined);
  const sub = producer.subscribe(set);
  onCleanup(() => sub.unsubscribe());
  return s;
}

export type WsMessage<T> = T & { id: string };

export type WsMessageUpCreate<I = any> = {
  type: "create";
  name: string;
  input?: I;
};

export type WsMessageUpSubscribe<I = any> = {
  type: "subscribe";
  ref: SerializedRef;
  input?: I;
};

export type WsMessageUpDispose = {
  type: "dispose";
};

export type WsMessageUpInvoke<I = any> = {
  type: "invoke";
  ref: SerializedRef;
  input?: I;
};
export type WsMessageUp<T = any> =
  | WsMessageUpCreate<T>
  | WsMessageUpSubscribe<T>
  | WsMessageUpDispose
  | WsMessageUpInvoke<T>;

export type WsMessageDown<T> = {
  value: T;
};

export type SerializedRef<I = any, O = any> = {
  __type: "ref";
  name: string;
  scope: string;
};
