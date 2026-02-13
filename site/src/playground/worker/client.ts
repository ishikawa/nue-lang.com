import type { PlaygroundRunRequest, PlaygroundRunResult } from "../core";
import type {
  PlaygroundWorkerEvent,
  PlaygroundWorkerMessage,
} from "./protocol";

interface PendingRequest {
  resolve: (result: PlaygroundRunResult) => void;
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
    await this.init();

    const requestId = String(++this.nextRequestNumber);
    this.activeRequestId = requestId;

    const result = await new Promise<PlaygroundRunResult>((resolve, reject) => {
      this.pendingRequests.set(requestId, { resolve, reject });
      this.postMessage({ kind: "run", requestId, request });
    });

    if (this.activeRequestId === requestId) {
      this.activeRequestId = undefined;
    }

    return result;
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
      if (!pending) {
        return;
      }
      this.pendingRequests.delete(event.requestId);
      pending.resolve(event.result);
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
