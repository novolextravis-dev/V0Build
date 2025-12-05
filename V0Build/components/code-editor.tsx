"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import type { FileNode } from "@/lib/types"

interface CodeEditorProps {
  file: FileNode | null
  onChange?: (content: string) => void
  readOnly?: boolean
}

const LANGUAGE_MAP: Record<string, string> = {
  typescript: "typescript",
  javascript: "javascript",
  json: "json",
  css: "css",
  scss: "scss",
  html: "html",
  markdown: "markdown",
  python: "python",
  sql: "sql",
  yaml: "yaml",
  shell: "shell",
  xml: "xml",
  graphql: "graphql",
  prisma: "prisma",
  plaintext: "plaintext",
}

function getMonacoLanguage(language: string): string {
  return LANGUAGE_MAP[language] || "plaintext"
}

export function CodeEditor({ file, onChange, readOnly = false }: CodeEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const monacoRef = useRef<typeof import("monaco-editor") | null>(null)
  const editorInstanceRef = useRef<import("monaco-editor").editor.IStandaloneCodeEditor | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const handleChange = useCallback(() => {
    if (onChange && editorInstanceRef.current) {
      onChange(editorInstanceRef.current.getValue())
    }
  }, [onChange])

  useEffect(() => {
    let mounted = true

    async function initMonaco() {
      if (!editorRef.current || !mounted) return

      try {
        const monaco = await import("monaco-editor")
        monacoRef.current = monaco

        monaco.editor.defineTheme("aurora-dark", {
          base: "vs-dark",
          inherit: true,
          rules: [
            { token: "comment", foreground: "6A9955", fontStyle: "italic" },
            { token: "keyword", foreground: "C586C0" },
            { token: "keyword.control", foreground: "C586C0" },
            { token: "string", foreground: "CE9178" },
            { token: "string.escape", foreground: "D7BA7D" },
            { token: "number", foreground: "B5CEA8" },
            { token: "type", foreground: "4EC9B0" },
            { token: "type.identifier", foreground: "4EC9B0" },
            { token: "function", foreground: "DCDCAA" },
            { token: "variable", foreground: "9CDCFE" },
            { token: "variable.predefined", foreground: "4FC1FF" },
            { token: "constant", foreground: "4FC1FF" },
            { token: "operator", foreground: "D4D4D4" },
            { token: "delimiter", foreground: "D4D4D4" },
            { token: "tag", foreground: "569CD6" },
            { token: "attribute.name", foreground: "9CDCFE" },
            { token: "attribute.value", foreground: "CE9178" },
          ],
          colors: {
            "editor.background": "#0a0a0a",
            "editor.foreground": "#d4d4d4",
            "editor.lineHighlightBackground": "#1a1a1a",
            "editor.lineHighlightBorder": "#1a1a1a",
            "editorLineNumber.foreground": "#505050",
            "editorLineNumber.activeForeground": "#c0c0c0",
            "editor.selectionBackground": "#264f78",
            "editor.inactiveSelectionBackground": "#3a3d41",
            "editorCursor.foreground": "#ffffff",
            "editorIndentGuide.background": "#404040",
            "editorIndentGuide.activeBackground": "#707070",
            "editorBracketMatch.background": "#0d3a58",
            "editorBracketMatch.border": "#1a6baa",
            "editorGutter.background": "#0a0a0a",
            "scrollbar.shadow": "#000000",
            "scrollbarSlider.background": "#4a4a4a50",
            "scrollbarSlider.hoverBackground": "#5a5a5a80",
            "scrollbarSlider.activeBackground": "#6a6a6aa0",
          },
        })

        const editor = monaco.editor.create(editorRef.current, {
          value: file?.content || "",
          language: getMonacoLanguage(file?.language || "plaintext"),
          theme: "aurora-dark",
          automaticLayout: true,
          minimap: { enabled: true, scale: 1, maxColumn: 80 },
          fontSize: 14,
          fontFamily: "'Geist Mono', 'Fira Code', 'JetBrains Mono', Consolas, monospace",
          fontLigatures: true,
          lineNumbers: "on",
          renderLineHighlight: "all",
          scrollBeyondLastLine: false,
          wordWrap: "on",
          wrappingStrategy: "advanced",
          tabSize: 2,
          insertSpaces: true,
          formatOnPaste: true,
          formatOnType: true,
          autoIndent: "full",
          suggestOnTriggerCharacters: true,
          quickSuggestions: {
            other: true,
            comments: false,
            strings: true,
          },
          acceptSuggestionOnEnter: "on",
          folding: true,
          foldingStrategy: "indentation",
          showFoldingControls: "mouseover",
          matchBrackets: "always",
          renderWhitespace: "selection",
          cursorBlinking: "smooth",
          cursorSmoothCaretAnimation: "on",
          smoothScrolling: true,
          readOnly,
          padding: { top: 16, bottom: 16 },
          bracketPairColorization: { enabled: true },
          guides: {
            bracketPairs: true,
            indentation: true,
          },
        })

        editorInstanceRef.current = editor
        editor.onDidChangeModelContent(handleChange)
        setIsLoading(false)
      } catch (error) {
        console.error("Failed to initialize Monaco editor:", error)
        setIsLoading(false)
      }
    }

    initMonaco()

    return () => {
      mounted = false
      if (editorInstanceRef.current) {
        editorInstanceRef.current.dispose()
        editorInstanceRef.current = null
      }
    }
  }, [handleChange])

  useEffect(() => {
    if (editorInstanceRef.current && monacoRef.current && file) {
      const model = editorInstanceRef.current.getModel()
      if (model) {
        const currentValue = model.getValue()
        if (currentValue !== file.content) {
          // Use pushEditOperations to preserve undo history
          model.pushEditOperations(
            [],
            [
              {
                range: model.getFullModelRange(),
                text: file.content || "",
              },
            ],
            () => null,
          )
        }
        monacoRef.current.editor.setModelLanguage(model, getMonacoLanguage(file.language || "plaintext"))
      }
    }
  }, [file])

  if (!file) {
    return (
      <div className="flex h-full items-center justify-center bg-[#0a0a0a] text-muted-foreground">
        <div className="text-center">
          <div className="mb-4 text-6xl opacity-20 font-mono">{"</>"}</div>
          <p className="text-lg">Select a file to view its contents</p>
          <p className="mt-2 text-sm text-muted-foreground/60">Or ask the AI to generate some code</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative h-full w-full">
      {isLoading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#0a0a0a]">
          <div className="flex items-center gap-3">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <span className="text-muted-foreground">Loading editor...</span>
          </div>
        </div>
      )}
      <div ref={editorRef} className="h-full w-full" />
    </div>
  )
}
