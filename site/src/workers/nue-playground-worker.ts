import type { WasmPlaygroundBindings } from "../playground/core";
import { registerPlaygroundWorker } from "../playground/worker";

function resolveWasmModuleUrl(): string {
  const configured =
    import.meta.env.PUBLIC_PLAYGROUND_WASM_MODULE_URL?.trim();
  if (configured) {
    return configured;
  }
  const base = import.meta.env.BASE_URL || "/";
  return new URL(`${base}pkg/nue_wasm.js`, self.location.origin).toString();
}

registerPlaygroundWorker({
  loadWasmModule: async () =>
    (await import(
      // Keep this runtime-only so Vite does not try to resolve external URLs.
      /* @vite-ignore */ resolveWasmModuleUrl()
    )) as unknown as WasmPlaygroundBindings,
});
