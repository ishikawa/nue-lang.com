export type PlaygroundRunStatus =
  | "success"
  | "compile_error"
  | "runtime_error"
  | "loader_error"
  | "resource_limit_exceeded";

export type PlaygroundEventKind = "stdout" | "stderr" | "diagnostic" | "system";
export type PlaygroundDiagnosticSeverity = "error" | "warning";

export interface PlaygroundPosition {
  line: number;
  character: number;
}

export interface PlaygroundRange {
  start: PlaygroundPosition;
  end: PlaygroundPosition;
}

export interface PlaygroundDiagnosticNote {
  message: string;
  range: PlaygroundRange | null;
}

export interface PlaygroundDiagnostic {
  code: string | null;
  message: string;
  severity: PlaygroundDiagnosticSeverity;
  filePath: string | null;
  range: PlaygroundRange | null;
  notes: PlaygroundDiagnosticNote[];
}

export type PlaygroundFormatStatus = "success" | "parse_error" | "runtime_error";

export interface PlaygroundFormatResult {
  status: PlaygroundFormatStatus;
  formatted: string;
  changed: boolean;
  message: string | null;
}

export interface PlaygroundEvent {
  kind: PlaygroundEventKind;
  text: string;
}

export interface PlaygroundRunResult {
  status: PlaygroundRunStatus;
  exitCode: number | null;
  message: string | null;
  stdout: string;
  stderr: string;
  events: PlaygroundEvent[];
  diagnostics: PlaygroundDiagnostic[];
}

export interface PlaygroundRunLimits {
  timeoutMs?: number;
  maxSteps?: number;
  maxOutputLines?: number;
  maxMemoryBytes?: number;
}

export interface PlaygroundRunRequest {
  source: string;
  limits?: PlaygroundRunLimits;
}

export interface WasmPlaygroundBindings {
  default: (moduleOrPath?: unknown) => Promise<unknown>;
  run_playground: (
    source: string,
    timeoutMs?: number,
    maxSteps?: number,
    maxOutputLines?: number,
    maxMemoryBytes?: number,
  ) => unknown;
  format_playground: (source: string) => unknown;
}

export type WasmModuleLoader = () => Promise<WasmPlaygroundBindings>;
