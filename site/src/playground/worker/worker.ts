import { createPlaygroundRuntime } from "../core";
import type {
  PlaygroundWorkerEvent,
  PlaygroundWorkerMessage,
  PlaygroundWorkerOptions,
} from "./protocol";

export function registerPlaygroundWorker(options: PlaygroundWorkerOptions): void {
  const runtime = createPlaygroundRuntime({ loadWasmModule: options.loadWasmModule });

  self.onmessage = (event: MessageEvent<PlaygroundWorkerMessage>) => {
    const message = event.data;

    if (message.kind === "cancel") {
      postMessage({ kind: "cancelled", requestId: message.requestId });
      return;
    }

    if (message.kind === "init") {
      void runtime
        .init()
        .then(() => {
          postMessage({ kind: "ready" });
        })
        .catch((error: unknown) => {
          postMessage({ kind: "error", message: formatError(error) });
        });
      return;
    }

    void runtime
      .run(message.request)
      .then((result) => {
        postMessage({ kind: "result", requestId: message.requestId, result });
      })
      .catch((error: unknown) => {
        postMessage({
          kind: "error",
          requestId: message.requestId,
          message: formatError(error),
        });
      });
  };
}

function postMessage(event: PlaygroundWorkerEvent): void {
  self.postMessage(event);
}

function formatError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}
