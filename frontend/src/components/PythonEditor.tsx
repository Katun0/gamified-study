import { useEffect, useRef, useState } from "react";
import { Compartment, EditorState, Prec } from "@codemirror/state";
import { EditorView, keymap } from "@codemirror/view";
import { indentWithTab } from "@codemirror/commands";
import { indentUnit } from "@codemirror/language";
import { python } from "@codemirror/lang-python";
import { oneDark } from "@codemirror/theme-one-dark";
import { basicSetup } from "codemirror";
import "./PythonEditor.css";

export default function PythonEditor({ value, onChange, onRun, disabled }: {
  value: string; onChange: (value: string) => void; onRun: () => void; disabled: boolean;
}) {
  const host = useRef<HTMLDivElement>(null);
  const editor = useRef<EditorView | null>(null);
  const initialValue = useRef(value);
  const callbacks = useRef({ onChange, onRun });
  const [readOnly] = useState(() => new Compartment());
  const [cursor, setCursor] = useState({ line: 1, column: 1 });

  useEffect(() => { callbacks.current = { onChange, onRun }; }, [onChange, onRun]);

  useEffect(() => {
    if (!host.current) return;
    const view = new EditorView({
      parent: host.current,
      state: EditorState.create({
        doc: initialValue.current,
        extensions: [
          basicSetup, python(), oneDark,
          indentUnit.of("    "), EditorState.tabSize.of(4),
          readOnly.of([EditorState.readOnly.of(false), EditorView.editable.of(true)]),
          Prec.high(keymap.of([
            { key: "Mod-Enter", run: () => { callbacks.current.onRun(); return true; } },
            indentWithTab,
          ])),
          EditorView.contentAttributes.of({ "aria-label": "Seu código Python", spellcheck: "false" }),
          EditorView.theme({
            "&": { fontSize: "14px", backgroundColor: "#0b1220" },
            ".cm-scroller": { fontFamily: "Consolas, 'Courier New', monospace", lineHeight: "1.65", overflow: "auto" },
            ".cm-content": { minHeight: "260px", padding: "12px 0" },
            ".cm-gutters": { backgroundColor: "#0b1220", color: "#687a94", borderRight: "1px solid #223047" },
            ".cm-activeLine, .cm-activeLineGutter": { backgroundColor: "#172238" },
            "&.cm-focused": { outline: "2px solid #38bdf8", outlineOffset: "-2px" },
          }),
          EditorView.updateListener.of((update) => {
            if (update.docChanged) callbacks.current.onChange(update.state.doc.toString());
            if (update.docChanged || update.selectionSet) {
              const position = update.state.selection.main.head;
              const line = update.state.doc.lineAt(position);
              setCursor({ line: line.number, column: position - line.from + 1 });
            }
          }),
        ],
      }),
    });
    editor.current = view;
    return () => { editor.current = null; view.destroy(); };
  }, [readOnly]);

  useEffect(() => {
    const view = editor.current;
    if (view && value !== view.state.doc.toString()) {
      view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: value } });
    }
  }, [value]);

  useEffect(() => {
    editor.current?.dispatch({ effects: readOnly.reconfigure([
      EditorState.readOnly.of(disabled), EditorView.editable.of(!disabled),
    ]) });
  }, [disabled, readOnly]);

  return <section className="sq-python-editor" aria-label="Editor de código">
    <div className="sq-python-editor-header"><span>solution.py</span><span>Python</span></div>
    <div ref={host} className="sq-python-editor-content" />
    <div className="sq-python-editor-status">
      <span>Linha {cursor.line}, coluna {cursor.column}</span><span>Espaços: 4 · UTF-8</span>
    </div>
    <div className="sq-python-editor-help">
      Tab: indentar · Shift+Tab: recuar · Ctrl/Cmd+Enter: executar
      <br />Para sair do editor pelo teclado, pressione Esc e depois Tab.
    </div>
  </section>;
}
