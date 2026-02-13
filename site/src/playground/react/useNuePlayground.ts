import type { PlaygroundRunLimits, PlaygroundRunResult } from "../core";
import {
  PlaygroundRunCancelledError,
  PlaygroundWorkerClient,
} from "../worker";
import { useCallback, useEffect, useRef, useState } from "react";

export type PlaygroundUiStatus = "initializing" | "ready" | "running" | "error";

export interface UseNuePlaygroundOptions {
  createWorker: () => Worker;
  initialSource: string;
  initialLimits?: PlaygroundRunLimits;
  autoInit?: boolean;
}

export interface UseNuePlaygroundResult {
  source: string;
  setSource: (next: string) => void;
  limits: PlaygroundRunLimits;
  setLimits: (next: PlaygroundRunLimits) => void;
  setLimit: <K extends keyof PlaygroundRunLimits>(
    key: K,
    value: PlaygroundRunLimits[K],
  ) => void;
  status: PlaygroundUiStatus;
  isRunning: boolean;
  error: string | null;
  result: PlaygroundRunResult | null;
  run: () => Promise<PlaygroundRunResult | null>;
  cancel: () => void;
  reset: () => void;
}

export function useNuePlayground(options: UseNuePlaygroundOptions): UseNuePlaygroundResult {
  const [source, setSource] = useState(options.initialSource);
  const [limits, setLimits] = useState<PlaygroundRunLimits>(options.initialLimits ?? {});
  const [status, setStatus] = useState<PlaygroundUiStatus>(
    options.autoInit === false ? "ready" : "initializing",
  );
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PlaygroundRunResult | null>(null);
  const clientRef = useRef<PlaygroundWorkerClient | null>(null);

  useEffect(() => {
    let alive = true;
    const client = new PlaygroundWorkerClient({ createWorker: options.createWorker });
    clientRef.current = client;

    if (options.autoInit !== false) {
      setStatus("initializing");
      void client
        .init()
        .then(() => {
          if (!alive || clientRef.current !== client) {
            return;
          }
          setStatus("ready");
        })
        .catch((initError: unknown) => {
          if (!alive || clientRef.current !== client) {
            return;
          }
          setStatus("error");
          setError(formatError(initError));
        });
    }

    return () => {
      alive = false;
      if (clientRef.current === client) {
        clientRef.current = null;
      }
      client.dispose();
    };
  }, [options.autoInit, options.createWorker]);

  const setLimit = useCallback(
    <K extends keyof PlaygroundRunLimits>(key: K, value: PlaygroundRunLimits[K]) => {
      setLimits((current) => ({ ...current, [key]: value }));
    },
    [],
  );

  const run = useCallback(async (): Promise<PlaygroundRunResult | null> => {
    const client = clientRef.current;
    if (!client) {
      setStatus("error");
      setError("Playground worker is not available.");
      return null;
    }

    setError(null);
    setStatus("running");

    try {
      const next = await client.run({ source, limits });
      setResult(next);
      setStatus("ready");
      return next;
    } catch (runError: unknown) {
      if (runError instanceof PlaygroundRunCancelledError) {
        setStatus("ready");
        return null;
      }

      setStatus("error");
      setError(formatError(runError));
      return null;
    }
  }, [limits, source]);

  const cancel = useCallback(() => {
    const client = clientRef.current;
    if (!client) {
      return;
    }

    client.cancelActiveRun();
    setStatus("ready");
  }, []);

  const reset = useCallback(() => {
    setSource(options.initialSource);
    setLimits(options.initialLimits ?? {});
    setResult(null);
    setError(null);
    setStatus("ready");
  }, [options.initialLimits, options.initialSource]);

  return {
    source,
    setSource,
    limits,
    setLimits,
    setLimit,
    status,
    isRunning: status === "running",
    error,
    result,
    run,
    cancel,
    reset,
  };
}

function formatError(value: unknown): string {
  if (value instanceof Error) {
    return value.message;
  }
  return String(value);
}
