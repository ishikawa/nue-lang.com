import type {
  PlaygroundFormatResult,
  PlaygroundRunRequest,
  PlaygroundRunResult,
} from "../core";
import type {
  PlaygroundWorkerEvent,
  PlaygroundWorkerFormatMessage,
  PlaygroundWorkerMessage,
  PlaygroundWorkerRunMessage,
} from "./protocol";

interface PendingRequest {
  kind: "run" | "format";
  resolve: (result: PlaygroundRunResult | PlaygroundFormatResult) => void;
  reject: (error: Error) => void;
}

export class PlaygroundRunCancelledError extends Error {
  constructor(message = "Playground run cancelled") {
    super(message);
    this.name = "PlaygroundRunCancelledError";
  }
}

export interface PlaygroundWorkerClientOptions {
  createWorker: () => Worker;
}

export class PlaygroundWorkerClient {
  private readonly createWorker: () => Worker;
  private worker: Worker;
  private isReady = false;
  private readyPromise: Promise<void> | undefined;
  private resolveReady: (() => void) | undefined;
  private rejectReady: ((error: Error) => void) | undefined;
  private readonly pendingRequests = new Map<string, PendingRequest>();
  private activeRequestId: string | undefined;
  private nextRequestNumber = 0;

  constructor(options: PlaygroundWorkerClientOptions) {
    this.createWorker = options.createWorker;
    this.worker = this.spawnWorker();
  }

  async init(): Promise<void> {
    if (this.isReady) {
      return;
    }

    if (!this.readyPromise) {
      this.readyPromise = new Promise<void>((resolve, reject) => {
        this.resolveReady = resolve;
        this.rejectReady = reject;
        this.postMessage({ kind: "init" });
      });
    }

    await this.readyPromise;
  }

  async run(request: PlaygroundRunRequest): Promise<PlaygroundRunResult> {
    return this.requestRun<PlaygroundRunResult>({ kind: "run", request });
  }

  async format(source: string): Promise<PlaygroundFormatResult> {
    return this.requestFormat<PlaygroundFormatResult>({ kind: "format", source });
  }

  private async requestRun<T extends PlaygroundRunResult>(
    request: Omit<PlaygroundWorkerRunMessage, "requestId">,
  ): Promise<T> {
    await this.init();
    return this.request<T, PlaygroundWorkerRunMessage>({ ...request, requestId: this.createRequestId() }, "run");
  }

  private async requestFormat<T extends PlaygroundFormatResult>(
    request: Omit<PlaygroundWorkerFormatMessage, "requestId">,
  ): Promise<T> {
    await this.init();
    return this.request<T, PlaygroundWorkerFormatMessage>({ ...request, requestId: this.createRequestId() }, "format");
  }

  private createRequestId(): string {
    return String(++this.nextRequestNumber);
  }

  private request<T, TMessage extends PlaygroundWorkerMessage>(
    message: TMessage & { requestId: string },
    kind: "run" | "format",
  ): Promise<T> {
    const requestId = message.requestId;
    this.activeRequestId = requestId;

    return new Promise<T>((resolve, reject) => {
      this.pendingRequests.set(requestId, {
        kind,
        resolve: resolve as (result: PlaygroundRunResult | PlaygroundFormatResult) => void,
        reject,
      });
      this.postMessage(message);
    }).finally(() => {
      if (this.activeRequestId === requestId) {
        this.activeRequestId = undefined;
      }
    });
  }

  cancelActiveRun(): void {
    if (!this.activeRequestId) {
      return;
    }

    const requestId = this.activeRequestId;
    const pending = this.pendingRequests.get(requestId);
    if (pending) {
      pending.reject(new PlaygroundRunCancelledError());
      this.pendingRequests.delete(requestId);
    }

    this.activeRequestId = undefined;
    this.postMessage({ kind: "cancel", requestId });
    this.recreateWorker();
  }

  dispose(): void {
    const error = new Error("Playground worker disposed");
    this.rejectReadyState(error);
    this.rejectAll(error);
    this.worker.terminate();
  }

  private spawnWorker(): Worker {
    const worker = this.createWorker();

    worker.onmessage = (event: MessageEvent<PlaygroundWorkerEvent>) => {
      this.handleWorkerEvent(event.data);
    };
    worker.onerror = (event: ErrorEvent) => {
      const error = new Error(event.message || "Playground worker crashed");
      this.rejectReadyState(error);
      this.rejectAll(error);
      this.recreateWorker();
    };

    return worker;
  }

  private recreateWorker(): void {
    this.worker.terminate();
    this.isReady = false;
    this.readyPromise = undefined;
    this.resolveReady = undefined;
    this.rejectReady = undefined;
    this.worker = this.spawnWorker();
  }

  private handleWorkerEvent(event: PlaygroundWorkerEvent): void {
    if (event.kind === "ready") {
      this.isReady = true;
      this.resolveReady?.();
      this.resolveReady = undefined;
      this.rejectReady = undefined;
      return;
    }

    if (event.kind === "result") {
      const pending = this.pendingRequests.get(event.requestId);
      if (!pending || pending.kind !== "run") {
        return;
      }

      this.pendingRequests.delete(event.requestId);
      const result = event.result as PlaygroundRunResult;
      pending.resolve(result);
      return;
    }

    if (event.kind === "format-result") {
      const pending = this.pendingRequests.get(event.requestId);
      if (!pending || pending.kind !== "format") {
        return;
      }

      this.pendingRequests.delete(event.requestId);
      const result = event.result as PlaygroundFormatResult;
      pending.resolve(result);
      return;
    }

    if (event.kind === "cancelled") {
      if (event.requestId && this.activeRequestId === event.requestId) {
        this.activeRequestId = undefined;
      }
      return;
    }

    const error = new Error(event.message);
    if (event.requestId) {
      const pending = this.pendingRequests.get(event.requestId);
      if (pending) {
        this.pendingRequests.delete(event.requestId);
        pending.reject(error);
      }
      return;
    }

    this.rejectReadyState(error);
    this.rejectAll(error);
  }

  private rejectReadyState(error: Error): void {
    this.isReady = false;
    if (this.rejectReady) {
      this.rejectReady(error);
    }
    this.readyPromise = undefined;
    this.resolveReady = undefined;
    this.rejectReady = undefined;
  }

  private rejectAll(error: Error): void {
    for (const pending of this.pendingRequests.values()) {
      pending.reject(error);
    }
    this.pendingRequests.clear();
    this.activeRequestId = undefined;
  }

  private postMessage(message: PlaygroundWorkerMessage): void {
    this.worker.postMessage(message);
  }
}
