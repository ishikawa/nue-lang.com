import type {
  PlaygroundRunRequest,
  PlaygroundRunResult,
  WasmModuleLoader,
} from "../core";

export interface PlaygroundWorkerOptions {
  loadWasmModule: WasmModuleLoader;
}

export interface PlaygroundWorkerInitMessage {
  kind: "init";
}

export interface PlaygroundWorkerRunMessage {
  kind: "run";
  requestId: string;
  request: PlaygroundRunRequest;
}

export interface PlaygroundWorkerCancelMessage {
  kind: "cancel";
  requestId?: string;
}

export type PlaygroundWorkerMessage =
  | PlaygroundWorkerInitMessage
  | PlaygroundWorkerRunMessage
  | PlaygroundWorkerCancelMessage;

export interface PlaygroundWorkerReadyEvent {
  kind: "ready";
}

export interface PlaygroundWorkerResultEvent {
  kind: "result";
  requestId: string;
  result: PlaygroundRunResult;
}

export interface PlaygroundWorkerErrorEvent {
  kind: "error";
  requestId?: string;
  message: string;
}

export interface PlaygroundWorkerCancelledEvent {
  kind: "cancelled";
  requestId?: string;
}

export type PlaygroundWorkerEvent =
  | PlaygroundWorkerReadyEvent
  | PlaygroundWorkerResultEvent
  | PlaygroundWorkerErrorEvent
  | PlaygroundWorkerCancelledEvent;
