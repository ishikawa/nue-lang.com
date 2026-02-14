import { PLAYGROUND_EXAMPLES } from "../playground/examples";
import { NuePlayground } from "../playground/react";

const createWorker = () =>
  new Worker(new URL("../workers/nue-playground-worker.ts", import.meta.url), {
    type: "module",
  });

export default function NuePlaygroundIsland() {
  return (
    <NuePlayground
      createWorker={createWorker}
      examples={PLAYGROUND_EXAMPLES}
    />
  );
}
