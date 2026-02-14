import type { PlaygroundExample } from "../react";

import enumMatchSource from "./enum_match.nue?raw";
import fibonacciSource from "./fibonacci.nue?raw";
import helloSource from "./hello.nue?raw";
import recordKeywordArgsSource from "./record_keyword_args.nue?raw";
import structDefaultsSource from "./struct_defaults.nue?raw";
import ufcsChainSource from "./ufcs_chain.nue?raw";
import uptoBlockLoopSource from "./upto_block_loop.nue?raw";

export const PLAYGROUND_EXAMPLES: PlaygroundExample[] = [
  {
    id: "hello",
    label: "Hello, World!",
    source: helloSource,
  },
  {
    id: "ufcs_chain",
    label: "UFCS Chain",
    source: ufcsChainSource,
  },
  {
    id: "upto_block_loop",
    label: "Loop using block",
    source: uptoBlockLoopSource,
  },
  {
    id: "fibonacci",
    label: "Fibonacci (Recursion)",
    source: fibonacciSource,
  },
  {
    id: "enum_match",
    label: "Enum + Pattern Match",
    source: enumMatchSource,
  },
  {
    id: "struct_defaults",
    label: "Struct Defaults",
    source: structDefaultsSource,
  },
  {
    id: "record_keyword_args",
    label: "Record + Keyword Args",
    source: recordKeywordArgsSource,
  },
];
