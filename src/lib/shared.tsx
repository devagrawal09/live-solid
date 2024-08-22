import { Observable } from "rxjs";
import {
  Accessor,
  createRoot,
  createEffect,
  getOwner,
  onCleanup,
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
