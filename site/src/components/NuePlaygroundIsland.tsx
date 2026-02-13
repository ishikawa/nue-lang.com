import { NuePlayground, type PlaygroundExample } from "../playground/react";

const EXAMPLES: PlaygroundExample[] = [
  {
    id: "hello",
    label: "Hello, World!",
    source: `from std::io import puts

def main() -> Int32 do
    puts("Hello from Nue")
    0
end
`,
  },
  {
    id: "ufcs_chain",
    label: "UFCS Chain",
    source: `def square(n: Int32) -> Int32 do
    n * n
end

def add(a: Int32, b: Int32) -> Int32 do
    a + b
end

def main() -> Int32 do
    assert! 5.square() == 25
    assert! 10.add(32) == 42
    assert! 2.add(3).square() == 25
    0
end
`,
  },
  {
    id: "enum_match",
    label: "Enum + Pattern Match",
    source: `enum Expr
    case Int(Int32)
    case Add(Int32, Int32)
    case Mul(Int32, Int32)
end

def eval(e: Expr) -> Int32 do
    case e
    when ::Int(n) then copy n
    when ::Add(a, b) then a + b
    when ::Mul(a, b) then a * b
    end
end

def main() -> Int32 do
    assert! eval(Expr::Add(1, 2)) == 3
    assert! eval(Expr::Mul(2, 3)) == 6
    0
end
`,
  },
];

const createWorker = () =>
  new Worker(new URL("../workers/nue-playground-worker.ts", import.meta.url), {
    type: "module",
  });

export default function NuePlaygroundIsland() {
  return (
    <NuePlayground
      createWorker={createWorker}
      examples={EXAMPLES}
    />
  );
}
