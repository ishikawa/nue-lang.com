import type {
  PlaygroundFormatResult,
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

export interface PlaygroundWorkerFormatMessage {
  kind: "format";
  requestId: string;
  source: string;
}

export interface PlaygroundWorkerCancelMessage {
  kind: "cancel";
  requestId?: string;
}

export type PlaygroundWorkerMessage =
  | PlaygroundWorkerInitMessage
  | PlaygroundWorkerRunMessage
  | PlaygroundWorkerFormatMessage
  | PlaygroundWorkerCancelMessage;

export interface PlaygroundWorkerReadyEvent {
  kind: "ready";
}

export interface PlaygroundWorkerResultEvent {
  kind: "result";
  requestId: string;
  result: PlaygroundRunResult;
}

export interface PlaygroundWorkerFormatResultEvent {
  kind: "format-result";
  requestId: string;
  result: PlaygroundFormatResult;
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
  | PlaygroundWorkerFormatResultEvent
  | PlaygroundWorkerErrorEvent
  | PlaygroundWorkerCancelledEvent;
