import {
  DEFAULT_PLAYGROUND_RUN_LIMITS,
  type PlaygroundDiagnostic,
  type PlaygroundRunLimits,
  type PlaygroundRunResult,
} from "../core";
import { useMemo } from "react";
import { defaultNueEditorRenderer, type NueEditorRenderer } from "./editor";
import { useNuePlayground } from "./useNuePlayground";
import "./styles.css";

const MILLISECONDS_PER_SECOND = 1_000;
const BYTES_PER_MB = 1024 * 1024;

export interface PlaygroundExample {
  id: string;
  label: string;
  source: string;
  limits?: PlaygroundRunLimits;
}

export interface NuePlaygroundProps {
  createWorker: () => Worker;
  initialSource?: string;
  initialLimits?: PlaygroundRunLimits;
  examples?: PlaygroundExample[];
  title?: string;
  subtitle?: string;
  className?: string;
  renderEditor?: NueEditorRenderer;
  onRunResult?: (result: PlaygroundRunResult) => void;
}

export function NuePlayground(props: NuePlaygroundProps) {
  const firstExample = props.examples?.[0];
  const initialSource =
    props.initialSource ??
    firstExample?.source ??
    "def main() -> Int32 do\n  0\nend\n";
  const renderEditor = props.renderEditor ?? defaultNueEditorRenderer;
  const initialLimits = useMemo(
    () => mergeRunLimits(DEFAULT_PLAYGROUND_RUN_LIMITS, props.initialLimits),
    [props.initialLimits],
  );

  const playground = useNuePlayground({
    createWorker: props.createWorker,
    initialSource,
    initialLimits,
  });

  const statusMessage = useMemo(() => {
    if (playground.status === "initializing") {
      return "Loading wasm runtime...";
    }
    if (playground.status === "running") {
      return "Executing in worker...";
    }
    if (playground.status === "error") {
      return playground.error ?? "Execution failed";
    }
    const result = playground.result;
    if (!result) {
      return "Ready";
    }
    return `status=${result.status} exit=${result.exitCode ?? "-"}`;
  }, [playground.error, playground.result, playground.status]);

  const stdout = playground.result?.stdout ?? "";
  const stderr = playground.result?.stderr || playground.result?.message || "";

  const selectExample = (exampleId: string) => {
    const example = props.examples?.find((item) => item.id === exampleId);
    if (!example) {
      return;
    }

    playground.setSource(example.source);
    playground.setLimits(mergeRunLimits(initialLimits, example.limits));
  };

  const run = async () => {
    const result = await playground.run();
    if (result && props.onRunResult) {
      props.onRunResult(result);
    }
  };

  return (
    <section
      className={["nue-playground", props.className].filter(Boolean).join(" ")}
    >
      <header className="nue-playground__header">
        <h2>{props.title ?? "Nue Playground"}</h2>
        <p>
          {props.subtitle ?? "Run Nue code in-browser via wasm + Web Worker."}
        </p>
      </header>

      <div className="nue-playground__layout">
        <div className="nue-playground__panel">
          {props.examples && props.examples.length > 0 ? (
            <label className="nue-playground__field">
              <span>Example</span>
              <select
                onChange={(event) => {
                  selectExample(event.currentTarget.value);
                }}
                defaultValue={firstExample?.id}
              >
                {props.examples.map((example) => (
                  <option key={example.id} value={example.id}>
                    {example.label}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          <label className="nue-playground__field">
            <span>Source</span>
            <div className="nue-playground__editor-shell">
              {renderEditor({
                className: "nue-playground__editor",
                value: playground.source,
                onChange: (nextValue) => {
                  playground.setSource(nextValue);
                },
              })}
            </div>
          </label>

          <div className="nue-playground__limits">
            <LimitInput
              label="Timeout (sec)"
              value={scaleDownLimit(
                playground.limits.timeoutMs,
                MILLISECONDS_PER_SECOND,
              )}
              onChange={(next) => {
                playground.setLimit(
                  "timeoutMs",
                  scaleUpLimit(next, MILLISECONDS_PER_SECOND),
                );
              }}
            />
            <LimitInput
              label="Max steps"
              value={playground.limits.maxSteps}
              onChange={(next) => {
                playground.setLimit("maxSteps", next);
              }}
            />
            <LimitInput
              label="Max output lines"
              value={playground.limits.maxOutputLines}
              onChange={(next) => {
                playground.setLimit("maxOutputLines", next);
              }}
            />
            <LimitInput
              label="Max memory (MB)"
              value={scaleDownLimit(
                playground.limits.maxMemoryBytes,
                BYTES_PER_MB,
              )}
              onChange={(next) => {
                playground.setLimit(
                  "maxMemoryBytes",
                  scaleUpLimit(next, BYTES_PER_MB),
                );
              }}
            />
          </div>

          <div className="nue-playground__buttons">
            <button
              type="button"
              onClick={() => {
                void run();
              }}
              disabled={
                playground.status === "initializing" || playground.isRunning
              }
            >
              Run
            </button>
            <button
              type="button"
              className="ghost"
              onClick={() => {
                playground.cancel();
              }}
              disabled={!playground.isRunning}
            >
              Stop
            </button>
            <button
              type="button"
              className="ghost"
              onClick={() => {
                playground.reset();
              }}
              disabled={playground.isRunning}
            >
              Reset
            </button>
          </div>
        </div>

        <div className="nue-playground__panel">
          <div className="nue-playground__status-row">
            <strong>Status</strong>
            <span className={`nue-playground__badge ${playground.status}`}>
              {playground.status}
            </span>
          </div>
          <p className="nue-playground__message">{statusMessage}</p>

          <OutputPanel title="stdout" text={stdout} />
          <OutputPanel title="stderr / diagnostics" text={stderr} />
        </div>
      </div>
    </section>
  );
}

function mergeRunLimits(
  base: PlaygroundRunLimits,
  override?: PlaygroundRunLimits,
): PlaygroundRunLimits {
  return {
    ...base,
    ...(override ?? {}),
  };
}

interface LimitInputProps {
  label: string;
  value: number | undefined;
  onChange: (value: number | undefined) => void;
}

function LimitInput(props: LimitInputProps) {
  return (
    <label className="nue-playground__field">
      <span>{props.label}</span>
      <input
        type="number"
        min={1}
        value={props.value ?? ""}
        onChange={(event) => {
          props.onChange(parseLimitInput(event.currentTarget.value));
        }}
      />
    </label>
  );
}

interface OutputPanelProps {
  title: string;
  text: string;
}

function OutputPanel(props: OutputPanelProps) {
  return (
    <div className="nue-playground__output">
      <strong>{props.title}</strong>
      <pre>{props.text}</pre>
    </div>
  );
}

function DiagnosticCard({ diagnostic }: { diagnostic: PlaygroundDiagnostic }) {
  const location = diagnostic.range
    ? `${diagnostic.range.start.line + 1}:${diagnostic.range.start.character + 1}`
    : "-";

  return (
    <article className={`nue-playground__diag ${diagnostic.severity}`}>
      <div className="nue-playground__diag-head">
        <span>{diagnostic.severity}</span>
        {diagnostic.code ? <code>{diagnostic.code}</code> : null}
      </div>
      <p>{diagnostic.message}</p>
      <small>
        file: {diagnostic.filePath ?? "(virtual)"} | location: {location}
      </small>
    </article>
  );
}

function parseLimitInput(raw: string): number | undefined {
  const value = Number(raw.trim());
  if (!Number.isFinite(value) || value <= 0) {
    return undefined;
  }
  return Math.min(Math.floor(value), 0xffffffff);
}

function scaleDownLimit(
  value: number | undefined,
  scale: number,
): number | undefined {
  if (value == null) {
    return undefined;
  }
  return Math.max(1, Math.floor(value / scale));
}

function scaleUpLimit(
  value: number | undefined,
  scale: number,
): number | undefined {
  if (value == null) {
    return undefined;
  }
  return Math.min(Math.floor(value * scale), 0xffffffff);
}
