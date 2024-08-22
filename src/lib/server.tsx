import { type Peer } from "crossws";
import { eventHandler } from "vinxi/http";
import { SerializedRef, WsMessageUp } from "./shared";

export type Endpoints = Record<string, (arg: any) => any>;

class LiveClient {
  private closures = new Map<string, any>();

  constructor(public peer: Peer, public endpoints: Endpoints) {}

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
    // const result = exposed[key](value);
    // console.log({ id, key, result });
    // const payload =
    //   result &&
    //   Object.entries(exposed[key](value)).reduce((res, [name, value]) => {
    //     return {
    //       ...res,
    //       [name]:
    //         typeof value === "function"
    //           ? createSeriazliedRef({ key: name, scope: id })
    //           : value,
    //     };
    //   }, {});
    // this.peer.send(
    //   JSON.stringify({
    //     id: id,
    //     value: payload,
    //   } satisfies WsMessageDown)
    // );
  }

  async cleanup() {}
}

const mapp = new Map<string, LiveClient>();

function createSeriazliedRef(
  opts: Omit<SerializedRef, "__type">
): SerializedRef {
  return { ...opts, __type: "ref" };
}

export const serverHandler = (e: Endpoints) =>
  eventHandler({
    handler() {},
    websocket: {
      open(peer) {
        mapp.set(peer.id, new LiveClient(peer, e));
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
