import { NuePlayground, type PlaygroundExample } from "../playground/react";

const EXAMPLES: PlaygroundExample[] = [
  {
    id: "hello",
    label: "Hello, World!",
    source: `# Start with the smallest runnable Nue program.
# It lets you confirm the environment and basic syntax in seconds.
from std::io import puts

def main() -> Int32 do
    puts("Hello, World!")
    0
end
`,
  },
  {
    id: "ufcs_chain",
    label: "UFCS Chain",
    source: `# This example shows UFCS (Uniform Function Call Syntax) chaining.
# You get pipeline-like readability while keeping free functions composable.
def square(n: Int32) -> Int32 do
    n * n
end

def add(a: Int32, b: Int32) -> Int32 do
    a + b
end

def main() -> Int32 do
    assert! 5.square() == 25
    assert! 5.square().square() == 625
    assert! 10.add(32) == 42
    assert! 2.add(3).square() == 25
    0
end
`,
  },
  {
    id: "upto_block_loop",
    label: "Loop using block",
    source: `# This example shows block-based iteration with practical control flow.
# You can keep loop logic concise and still use continue/break where it matters.
from core::iterable import upto
from std::io import puts

def main() -> Int32 do
    total = 0
    1.upto(10) do |i| -> Void
        if i == 2 or i == 4
            continue
        end

        if i > 7
            break
        end

        set total = total + i
    end

    assert! total == 22
    puts("total=22")
    0
end
`,
  },
  {
    id: "fibonacci",
    label: "Fibonacci (Recursion)",
    source: `# A recursive Fibonacci implementation with integer branching.
# It demonstrates expressive core language features without extra runtime concepts.
from std::io import puts

# A simple implementation of the Fibonacci sequence using recursion.
def fibonacci(n: Int32) -> Int32
    if n <= 1
        copy n
    else
        fibonacci(n - 1) + fibonacci(n - 2)
    end
end

def main() -> Int32 do
    assert! fibonacci(10) == 55
    puts("fib(10) == 55")
    0
end
`,
  },
  {
    id: "enum_match",
    label: "Enum + Pattern Match",
    source: `# Define an enum and evaluate it with pattern matching.
# Branching logic stays explicit and type-driven.
enum Expr
    case Int(Int32)
    case Add(Int32, Int32)
    case Mul(Int32, Int32)
end

def eval(e: Expr) -> Int32 do
    case e
    when ::Int(n)
        copy n
    when ::Add(a, b)
        a + b
    when ::Mul(a, b)
        a * b
    end
end

def main() -> Int32 do
    assert! eval(Expr::Add(1, 2)) == 3
    assert! eval(Expr::Mul(2, 3)) == 6
    0
end
`,
  },
  {
    id: "struct_defaults",
    label: "Struct Defaults",
    source: `# Model a config-like struct with field defaults and methods.
# It keeps practical state modeling concise and readable.
struct RetryPolicy do
    max_retry: Int32 = 3
    base_delay_ms: Int32 = 50
    timeout_ms: Int32

    def budget_ms(self) -> Int32 do
        self.timeout_ms + self.base_delay_ms * self.max_retry
    end
end

def main() -> Int32 do
    policy1 = RetryPolicy{ timeout_ms: 200, max_retry: 2 }
    assert! policy1.base_delay_ms == 50
    assert! policy1.budget_ms() == 300

    policy2 = RetryPolicy{ timeout_ms: 100 }
    assert! policy2.max_retry == 3
    assert! policy2.budget_ms() == 250

    policy3 = { timeout_ms: 150, base_delay_ms: 10 }
    assert! policy3.max_retry == 3
    assert! policy3.budget_ms() == 180
    0
end
`,
  },
  {
    id: "record_keyword_args",
    label: "Record + Keyword Args",
    source: `# Record defaults and keyword arguments for the final parameter.
# This keeps options-style APIs explicit and concise.
from std::io import puts

struct RuntimeOptions do
    timeout_ms: Int32
    retry: Int32
    verbose: Bool
end

def run_with_options(
    base: Int32,
    own opt: { timeout_ms: Int32 = 30, retry: Int32 = 3, verbose: Bool = false },
) -> Int32 do
    typed = RuntimeOptions{ ...move opt }
    bonus = 0
    if typed.verbose
        set bonus = 100
    end
    base + typed.timeout_ms + typed.retry + bonus
end

def main() -> Int32 do
    # Keyword arguments are sugar for constructing the final record argument.
    score1 = run_with_options(1, timeout_ms: 10)
    score2 = run_with_options(1, timeout_ms: 10, retry: 1)
    score3 = run_with_options(1, retry: 2, verbose: true)
    assert! score1 == 14
    assert! score2 == 12
    assert! score3 == 133
    puts("keyword sugar => 14, 12, 133")

    # Explicit record literal form remains available.
    score4 = run_with_options(1, { timeout_ms: 20, retry: 1, verbose: false })
    assert! score4 == 22
    puts("explicit record => 22")
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
