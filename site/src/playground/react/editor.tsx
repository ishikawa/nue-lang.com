import { useEffect, useState } from "react";
import type { ComponentType, ReactNode } from "react";
import { EditorView } from "@codemirror/view";
import { nueLanguage } from "./nueLanguage";

export interface NueEditorProps {
  value: string;
  onChange: (nextValue: string) => void;
  disabled?: boolean;
  className?: string;
}

export type NueEditorRenderer = (props: NueEditorProps) => ReactNode;

interface CodeMirrorLikeProps {
  value: string;
  height?: string;
  editable?: boolean;
  className?: string;
  theme?: "light" | "dark";
  extensions?: readonly unknown[];
  basicSetup?: {
    lineNumbers?: boolean;
    highlightActiveLine?: boolean;
    foldGutter?: boolean;
    autocompletion?: boolean;
    lineWrapping?: boolean;
  };
  onChange: (value: string) => void;
}

export function defaultNueEditorRenderer(props: NueEditorProps): ReactNode {
  return <CodeMirrorEditor {...props} />;
}

const NUE_CODEMIRROR_EXTENSIONS: readonly unknown[] = [
  nueLanguage,
  EditorView.lineWrapping,
];

function CodeMirrorEditor(props: NueEditorProps) {
  const [codeMirror, setCodeMirror] =
    useState<ComponentType<CodeMirrorLikeProps> | null>(null);

  useEffect(() => {
    let active = true;

    void import("@uiw/react-codemirror").then((module) => {
      if (!active) {
        return;
      }
      setCodeMirror(() => module.default as ComponentType<CodeMirrorLikeProps>);
    });

    return () => {
      active = false;
    };
  }, []);

  if (!codeMirror) {
    return (
      <textarea
        className={["nue-playground__editor-fallback", props.className]
          .filter(Boolean)
          .join(" ")}
        value={props.value}
        onChange={(event) => {
          props.onChange(event.currentTarget.value);
        }}
        disabled={props.disabled}
        spellCheck={false}
        rows={16}
      />
    );
  }

  const CodeMirror = codeMirror;
  return (
    <CodeMirror
      className={props.className}
      value={props.value}
      height="360px"
      theme="dark"
      editable={!props.disabled}
      extensions={NUE_CODEMIRROR_EXTENSIONS}
      basicSetup={{
        lineNumbers: true,
        highlightActiveLine: true,
        foldGutter: true,
        autocompletion: true,
      }}
      onChange={(value) => {
        props.onChange(value);
      }}
    />
  );
}
