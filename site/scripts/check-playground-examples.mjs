import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { initSync, run_playground } from "../public/pkg/nue_wasm.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const siteRoot = join(__dirname, "..");
const wasmPath = join(siteRoot, "public", "pkg", "nue_wasm_bg.wasm");
const examplesDir = join(siteRoot, "src", "playground", "examples");

const wasm = readFileSync(wasmPath);
initSync({ module: wasm });

const exampleFiles = readdirSync(examplesDir)
  .filter((file) => file.endsWith(".nue"))
  .sort();

if (exampleFiles.length === 0) {
  console.error(`No .nue files found under ${examplesDir}`);
  process.exit(1);
}

let failed = 0;

for (const file of exampleFiles) {
  const source = readFileSync(join(examplesDir, file), "utf8");
  const result = run_playground(source);
  const ok =
    result.status === "success" &&
    (result.exitCode === 0 || result.exitCode === null);

  if (ok) {
    console.log(`OK ${file} status=${result.status} exit=${result.exitCode}`);
    continue;
  }

  failed += 1;
  console.error(`NG ${file} status=${result.status} exit=${result.exitCode}`);
  if (result.message) {
    console.error(`  message: ${result.message}`);
  }
  if (Array.isArray(result.diagnostics)) {
    for (const diagnostic of result.diagnostics) {
      const code = diagnostic?.code ?? "unknown";
      const message = diagnostic?.message ?? "diagnostic without message";
      console.error(`  diagnostic[${code}]: ${message}`);
    }
  }
}

if (failed > 0) {
  console.error(`\n${failed} example(s) failed.`);
  process.exit(1);
}

console.log(`\nAll ${exampleFiles.length} playground examples passed.`);
