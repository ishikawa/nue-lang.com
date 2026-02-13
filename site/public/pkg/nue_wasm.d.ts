/* tslint:disable */
/* eslint-disable */

/**
 * Formats one source string using the shared formatter pipeline.
 */
export function format_playground(source: string): any;

/**
 * Runs one Nue source file in the browser-friendly playground pipeline.
 *
 * This function is the wasm bridge used by `web/main.js`. It returns a plain
 * JavaScript object so the frontend can render status, diagnostics, and
 * emitted runtime events without any backend service.
 */
export function run_playground(source: string, timeout_ms?: number | null, max_steps?: number | null, max_output_lines?: number | null, max_memory_bytes?: number | null): any;

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
    readonly memory: WebAssembly.Memory;
    readonly format_playground: (a: number, b: number) => any;
    readonly run_playground: (a: number, b: number, c: number, d: number, e: number, f: number) => any;
    readonly __wbindgen_malloc: (a: number, b: number) => number;
    readonly __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
    readonly __wbindgen_exn_store: (a: number) => void;
    readonly __externref_table_alloc: () => number;
    readonly __wbindgen_externrefs: WebAssembly.Table;
    readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;

/**
 * Instantiates the given `module`, which can either be bytes or
 * a precompiled `WebAssembly.Module`.
 *
 * @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
 *
 * @returns {InitOutput}
 */
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
 * If `module_or_path` is {RequestInfo} or {URL}, makes a request and
 * for everything else, calls `WebAssembly.instantiate` directly.
 *
 * @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
 *
 * @returns {Promise<InitOutput>}
 */
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
