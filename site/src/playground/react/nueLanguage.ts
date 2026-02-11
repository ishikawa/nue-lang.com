import { StreamLanguage } from "@codemirror/language";

type PendingNameKind = "function" | "type" | "variant";

interface NueTokenizerState {
  inString: boolean;
  pendingName: PendingNameKind | null;
}

const KEYWORDS = new Set([
  "let",
  "set",
  "def",
  "alias",
  "const",
  "fn",
  "do",
  "end",
  "if",
  "cond",
  "while",
  "then",
  "else",
  "case",
  "when",
  "where",
  "struct",
  "enum",
  "protocol",
  "conform",
  "import",
  "from",
  "for",
  "break",
  "continue",
  "return",
  "guard",
  "defer",
  "and",
  "or",
  "as",
  "move",
  "copy",
  "ref",
  "some",
  "static",
  "own",
  "inout",
  "public",
  "unsafe",
  "type",
]);

const TYPE_DECLARATION_KEYWORDS = new Set(["struct", "enum", "protocol", "alias"]);
const BUILTIN_TYPES = new Set([
  "Int8",
  "Int16",
  "Int32",
  "Int64",
  "UInt8",
  "UInt16",
  "UInt32",
  "UInt64",
  "Size",
  "USize",
  "Float16",
  "Float32",
  "Float64",
  "Bool",
  "Void",
  "Never",
]);

const IDENTIFIER_RE = /\$[A-Za-z0-9_]*(?:[!?])?|[A-Za-z_][A-Za-z0-9_]*(?:[!?])?/;
const NUMBER_RE = /\d+(?:\.\d+)?(?:[eE][+-]?\d+)?\b/;

export const nueLanguage = StreamLanguage.define<NueTokenizerState>({
  startState() {
    return { inString: false, pendingName: null };
  },
  token(stream, state) {
    if (state.inString) {
      return readStringToken(stream, state);
    }

    if (stream.eatSpace()) {
      return null;
    }

    if (stream.match("#")) {
      stream.skipToEnd();
      return "comment";
    }

    if (stream.match('"')) {
      state.inString = true;
      return readStringToken(stream, state);
    }

    if (stream.match(/@[A-Za-z_][A-Za-z0-9_]*/)) {
      return "attribute";
    }

    if (stream.match(/==|!=|<=|>=|->|\.\.\./)) {
      return "operator";
    }
    if (stream.match(/::/)) {
      return "punctuation";
    }

    if (stream.match(NUMBER_RE)) {
      return "number";
    }

    if (stream.match(IDENTIFIER_RE)) {
      const identifier = stream.current();

      if (state.pendingName) {
        const pendingName = state.pendingName;
        state.pendingName = null;
        if (pendingName === "function") {
          return "def";
        }
        if (pendingName === "type") {
          return "type";
        }
        return "atom";
      }

      if (identifier === "assert!" || identifier === "panic!") {
        return "keyword";
      }

      if (KEYWORDS.has(identifier)) {
        if (identifier === "def") {
          state.pendingName = "function";
        } else if (TYPE_DECLARATION_KEYWORDS.has(identifier)) {
          state.pendingName = "type";
        } else if (identifier === "case") {
          state.pendingName = "variant";
        }
        return "keyword";
      }

      if (identifier === "true" || identifier === "false") {
        return "atom";
      }

      if (identifier === "self" || identifier === "Self" || identifier === "_") {
        return "variable-2";
      }

      if (BUILTIN_TYPES.has(identifier) || /^[A-Z]/.test(identifier)) {
        return "type";
      }

      if (stream.match(/\s*:(?!:)/, false)) {
        return "property";
      }

      if (stream.match(/\s*\(/, false)) {
        return "variableName.function";
      }

      if (stream.match(/\s*::/, false)) {
        return "qualifier";
      }

      return "variable";
    }

    if (stream.match(/[=<>+\-*\/!&|]/)) {
      return "operator";
    }
    if (stream.match(/[:;,\.@]/)) {
      return "punctuation";
    }
    if (stream.match(/[\[\]{}()]/)) {
      return "bracket";
    }

    stream.next();
    return null;
  },
  languageData: {
    commentTokens: { line: "#" },
  },
});

function readStringToken(
  stream: {
    eol: () => boolean;
    next: () => string | void;
  },
  state: NueTokenizerState,
): string {
  let escaped = false;

  while (!stream.eol()) {
    const nextChar = stream.next();
    if (!nextChar) {
      break;
    }

    if (nextChar === '"' && !escaped) {
      state.inString = false;
      break;
    }

    escaped = nextChar === "\\" && !escaped;
    if (nextChar !== "\\") {
      escaped = false;
    }
  }

  return "string";
}
