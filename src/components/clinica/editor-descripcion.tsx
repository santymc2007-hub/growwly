"use client";

import { useMemo, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { Bold } from "lucide-react";

const ALTO_MINIMO = "min-h-[220px]";

function escapar(texto: string): string {
  return texto
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * Las descripciones antiguas son texto plano: cada línea en blanco
 * separa párrafos y cada salto simple se mantiene como salto de línea.
 */
function comoHtmlInicial(valor: string | null | undefined): string {
  if (!valor) return "";
  if (/<(p|strong|br|b)\b[^>]*>/i.test(valor)) return valor;
  return valor
    .split(/\n\s*\n/)
    .map((parrafo) => `<p>${escapar(parrafo.trim()).replace(/\n/g, "<br>")}</p>`)
    .join("");
}

/**
 * Editor de la descripción de la ficha: solo negrita y párrafos (Intro
 * para un párrafo nuevo, Mayús+Intro para un salto de línea). Guarda el
 * HTML en un input oculto con el mismo `name` que tenía el textarea.
 */
export function EditorDescripcion({
  name,
  defaultValue,
  placeholder = "Cuenta a los pacientes quiénes sois, cómo trabajáis y qué os diferencia…",
}: {
  name: string;
  defaultValue?: string | null;
  placeholder?: string;
}) {
  const inicial = useMemo(() => comoHtmlInicial(defaultValue), [defaultValue]);
  const [html, setHtml] = useState(inicial);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: false,
        blockquote: false,
        bulletList: false,
        orderedList: false,
        listItem: false,
        code: false,
        codeBlock: false,
        horizontalRule: false,
        italic: false,
        strike: false,
        underline: false,
        link: false,
      }),
      Placeholder.configure({ placeholder }),
    ],
    content: inicial,
    onUpdate: ({ editor }) => setHtml(editor.isEmpty ? "" : editor.getHTML()),
    editorProps: {
      attributes: {
        class: `${ALTO_MINIMO} max-h-[520px] overflow-y-auto rounded-b-lg border border-t-0 border-line bg-white px-3 py-2.5 text-sm leading-relaxed text-ink focus:outline-none [&_p+p]:mt-3 [&_strong]:font-semibold [&_p.is-editor-empty:first-child::before]:pointer-events-none [&_p.is-editor-empty:first-child::before]:float-left [&_p.is-editor-empty:first-child::before]:h-0 [&_p.is-editor-empty:first-child::before]:text-ink-soft/60 [&_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)]`,
      },
    },
  });

  if (!editor) {
    // Antes de montar en el cliente: textarea normal con el mismo name.
    return (
      <textarea
        name={name}
        rows={9}
        defaultValue={defaultValue ?? ""}
        className={`mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-teal/30 ${ALTO_MINIMO}`}
      />
    );
  }

  return (
    <div className="mt-1 rounded-lg focus-within:ring-2 focus-within:ring-teal/30">
      <input type="hidden" name={name} value={html} />
      <div className="flex items-center gap-2 rounded-t-lg border border-line bg-paper-dim px-2 py-1.5">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          aria-label="Negrita"
          aria-pressed={editor.isActive("bold")}
          className={`press flex h-8 w-8 items-center justify-center rounded-md transition-colors ${
            editor.isActive("bold")
              ? "bg-teal text-white"
              : "text-ink hover:bg-white"
          }`}
        >
          <Bold className="h-4 w-4" aria-hidden />
        </button>
        <span className="text-xs text-ink-soft">
          Selecciona texto y pulsa <strong>B</strong> para negrita · Intro para un párrafo nuevo
        </span>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
