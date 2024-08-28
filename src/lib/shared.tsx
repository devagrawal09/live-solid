import { Observable } from "rxjs";
import {
  type Accessor,
  createRoot,
  createEffect,
  getOwner,
  onCleanup,
  createSignal,
} from "../../lib/signals";

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

export function from<T>(producer: {
  subscribe: (fn: (v: T) => void) => { unsubscribe: () => void };
}): Accessor<T | undefined> {
  const [s, set] = createSignal<T | undefined>(undefined, { equals: false });
  if ("subscribe" in producer) {
    const unsub = producer.subscribe((v) => set(() => v));
    onCleanup(() => unsub.unsubscribe());
  }
  return s;
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

export type SerializedRef = {
  __type: "ref";
  key: string;
  scope: string;
};
