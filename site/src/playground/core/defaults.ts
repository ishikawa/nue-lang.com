import type { PlaygroundRunLimits } from "./types";

// Keep these in sync with Rust defaults in `src/playground.rs`.
export const DEFAULT_PLAYGROUND_RUN_LIMITS: Readonly<Required<PlaygroundRunLimits>> =
  Object.freeze({
    timeoutMs: 10_000,
    maxSteps: 5_000_000,
    maxOutputLines: 1_000,
    maxMemoryBytes: 5 * 1024 * 1024,
  });
