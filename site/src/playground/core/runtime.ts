import type {
  PlaygroundDiagnostic,
  PlaygroundDiagnosticNote,
  PlaygroundEvent,
  PlaygroundFormatResult,
  PlaygroundFormatStatus,
  PlaygroundRange,
  PlaygroundRunLimits,
  PlaygroundRunRequest,
  PlaygroundRunResult,
  PlaygroundRunStatus,
  WasmModuleLoader,
  WasmPlaygroundBindings,
} from "./types";

export interface PlaygroundRuntimeOptions {
  loadWasmModule: WasmModuleLoader;
}

export interface PlaygroundRuntime {
  init: () => Promise<void>;
  run: (request: PlaygroundRunRequest) => Promise<PlaygroundRunResult>;
  format: (source: string) => Promise<PlaygroundFormatResult>;
}

const STATUS_VALUES = new Set<PlaygroundRunStatus>([
  "success",
  "compile_error",
  "runtime_error",
  "loader_error",
  "resource_limit_exceeded",
]);

const FORMAT_STATUS_VALUES = new Set<PlaygroundFormatStatus>([
  "success",
  "parse_error",
  "runtime_error",
]);

export function createPlaygroundRuntime(options: PlaygroundRuntimeOptions): PlaygroundRuntime {
  let bindingsPromise: Promise<WasmPlaygroundBindings> | undefined;
  let initPromise: Promise<void> | undefined;

  const getBindings = async (): Promise<WasmPlaygroundBindings> => {
    if (!bindingsPromise) {
      bindingsPromise = options.loadWasmModule();
    }
    return bindingsPromise;
  };

  const init = async (): Promise<void> => {
    if (!initPromise) {
      initPromise = (async () => {
        const bindings = await getBindings();
        await bindings.default();
      })();
    }
    await initPromise;
  };

  const run = async ({ source, limits }: PlaygroundRunRequest): Promise<PlaygroundRunResult> => {
    await init();

    const sanitizedLimits = sanitizeLimits(limits);
    const bindings = await getBindings();

    const rawResult = bindings.run_playground(
      source,
      sanitizedLimits.timeoutMs,
      sanitizedLimits.maxSteps,
      sanitizedLimits.maxOutputLines,
      sanitizedLimits.maxMemoryBytes,
    );
    return normalizeResult(rawResult);
  };

  const format = async (source: string): Promise<PlaygroundFormatResult> => {
    await init();
    const bindings = await getBindings();
    const rawResult = bindings.format_playground(source);
    return normalizeFormatResult(rawResult);
  };

  return { init, run, format };
}

function sanitizeLimits(limits?: PlaygroundRunLimits) {
  return {
    timeoutMs: clampOptionalU32(limits?.timeoutMs),
    maxSteps: clampOptionalU32(limits?.maxSteps),
    maxOutputLines: clampOptionalU32(limits?.maxOutputLines),
    maxMemoryBytes: clampOptionalU32(limits?.maxMemoryBytes),
  };
}

function clampOptionalU32(value: number | undefined): number | undefined {
  if (value == null) {
    return undefined;
  }
  if (!Number.isFinite(value) || value <= 0) {
    return undefined;
  }
  return Math.min(Math.floor(value), 0xffffffff);
}

function normalizeResult(raw: unknown): PlaygroundRunResult {
  const object = toObject(raw);

  return {
    status: parseStatus(object.status),
    exitCode: parseOptionalNumber(object.exitCode),
    message: parseOptionalString(object.message),
    stdout: parseString(object.stdout),
    stderr: parseString(object.stderr),
    events: parseEvents(object.events),
    diagnostics: parseDiagnostics(object.diagnostics),
  };
}

function normalizeFormatResult(raw: unknown): PlaygroundFormatResult {
  const object = toObject(raw);

  return {
    status: parseFormatStatus(object.status),
    formatted: parseString(object.formatted),
    changed: parseBoolean(object.changed),
    message: parseOptionalString(object.message),
  };
}

function parseStatus(value: unknown): PlaygroundRunStatus {
  if (typeof value === "string" && STATUS_VALUES.has(value as PlaygroundRunStatus)) {
    return value as PlaygroundRunStatus;
  }
  return "runtime_error";
}

function parseFormatStatus(value: unknown): PlaygroundFormatStatus {
  if (typeof value === "string" && FORMAT_STATUS_VALUES.has(value as PlaygroundFormatStatus)) {
    return value as PlaygroundFormatStatus;
  }
  return "runtime_error";
}

function parseEvents(value: unknown): PlaygroundEvent[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((item) => {
    const object = toObject(item);
    const kind =
      object.kind === "stdout" ||
      object.kind === "stderr" ||
      object.kind === "diagnostic" ||
      object.kind === "system"
        ? object.kind
        : "system";
    return {
      kind,
      text: parseString(object.text),
    };
  });
}

function parseDiagnostics(value: unknown): PlaygroundDiagnostic[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((item) => {
    const object = toObject(item);
    return {
      code: parseOptionalString(object.code),
      message: parseString(object.message),
      severity: object.severity === "warning" ? "warning" : "error",
      filePath: parseOptionalString(object.filePath),
      range: parseRange(object.range),
      notes: parseNotes(object.notes),
    } satisfies PlaygroundDiagnostic;
  });
}

function parseNotes(value: unknown): PlaygroundDiagnosticNote[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((item) => {
    const object = toObject(item);
    return {
      message: parseString(object.message),
      range: parseRange(object.range),
    } satisfies PlaygroundDiagnosticNote;
  });
}

function parseRange(value: unknown): PlaygroundRange | null {
  const object = toObjectOrNull(value);
  if (!object) {
    return null;
  }

  const start = toObjectOrNull(object.start);
  const end = toObjectOrNull(object.end);
  if (!start || !end) {
    return null;
  }

  return {
    start: {
      line: parseNumber(start.line),
      character: parseNumber(start.character),
    },
    end: {
      line: parseNumber(end.line),
      character: parseNumber(end.character),
    },
  };
}

function parseString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function parseOptionalString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function parseOptionalNumber(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return null;
  }
  return value;
}

function parseBoolean(value: unknown): boolean {
  return typeof value === "boolean" ? value : false;
}

function parseNumber(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return 0;
  }
  return value;
}

function toObject(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object") {
    return value as Record<string, unknown>;
  }
  return {};
}

function toObjectOrNull(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === "object") {
    return value as Record<string, unknown>;
  }
  return null;
}
