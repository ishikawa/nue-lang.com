import type { WasmPlaygroundBindings } from "../playground/core";
import { registerPlaygroundWorker } from "../playground/worker";

function resolveWasmModuleUrl(): string {
  const configured =
    import.meta.env.PUBLIC_PLAYGROUND_WASM_MODULE_URL?.trim();
  if (configured) {
    return configured;
  }
  const rawBase = import.meta.env.BASE_URL || "/";
  const base = rawBase.endsWith("/") ? rawBase : `${rawBase}/`;
  const baseUrl = new URL(base, self.location.origin);
  return new URL("pkg/nue_wasm.js", baseUrl).toString();
}

registerPlaygroundWorker({
  loadWasmModule: async () =>
    (await import(
      // Keep this runtime-only so Vite does not try to resolve external URLs.
      /* @vite-ignore */ resolveWasmModuleUrl()
    )) as unknown as WasmPlaygroundBindings,
});
