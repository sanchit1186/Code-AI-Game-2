"use client";

import MonacoEditor, { type OnMount, type BeforeMount } from "@monaco-editor/react";
import { getLangConfig } from "@/lib/languageMap";

export interface CursorPosition {
  line: number;
  col: number;
}

interface EditorProps {
  filename: string;
  value: string;
  onChange: (value: string) => void;
  onCursorChange?: (pos: CursorPosition) => void;
  theme?: string;
}

const MONACO_LANGUAGES: Record<string, string> = {
  javascript: "javascript",
  typescript: "typescript",
  python: "python",
  cpp: "cpp",
  c: "c",
  java: "java",
  html: "html",
  css: "css",
};

export default function Editor({
  filename,
  value,
  onChange,
  onCursorChange,
  theme = "heist-dark",
}: EditorProps) {
  const language = getLangConfig(filename);
  const extension = filename.split(".").pop()?.toLowerCase() ?? "";
  const languageId = language ? MONACO_LANGUAGES[language.cmLanguage] : undefined;

  const handleBeforeMount: BeforeMount = (monaco) => {
    monaco.editor.defineTheme("heist-dark", {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "comment", foreground: "6b7280", fontStyle: "italic" },
        { token: "keyword", foreground: "f87171", fontStyle: "bold" },
        { token: "string", foreground: "86efac" },
        { token: "number", foreground: "fcd34d" },
        { token: "function", foreground: "60a5fa" },
        { token: "operator", foreground: "fca5a5" },
      ],
      colors: {
        "editor.background": "#0b0c10",
        "editor.foreground": "#e5e7eb",
        "editorLineNumber.foreground": "#4b5563",
        "editorLineNumber.activeForeground": "#ef4444",
        "editor.lineHighlightBackground": "#15161f",
        "editorGutter.background": "#0b0c10",
        "editorCursor.foreground": "#ef4444",
        "editor.selectionBackground": "#7f1d1d55",
      },
    });
  };

  const handleMount: OnMount = (editor) => {
    onCursorChange?.({
      line: editor.getPosition()?.lineNumber ?? 1,
      col: editor.getPosition()?.column ?? 1,
    });
    editor.onDidChangeCursorPosition((event) => {
      onCursorChange?.({ line: event.position.lineNumber, col: event.position.column });
    });
  };

  return (
    <div className="h-full w-full bg-[#0b0c10]">
      <MonacoEditor
        value={value}
        theme={theme}
        language={languageId ?? (extension === "jsx" ? "javascript" : extension)}
        beforeMount={handleBeforeMount}
        onChange={(nextValue) => onChange(nextValue ?? "")}
        onMount={handleMount}
        height="100%"
        options={{
          automaticLayout: true,
          fontSize: 13,
          fontFamily: "var(--font-mono)",
          minimap: { enabled: false },
          padding: { top: 12 },
          tabSize: 4,
          wordWrap: "on",
          lineNumbers: "on",
          renderLineHighlight: "all",
          cursorBlinking: "smooth",
          smoothScrolling: true,
        }}
      />
    </div>
  );
}
