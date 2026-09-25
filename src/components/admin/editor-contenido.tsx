"use client";

import { useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import Placeholder from "@tiptap/extension-placeholder";
import { Bold, Italic, List, ListOrdered } from "lucide-react";

const COLORES = [
  { nombre: "Teal", valor: "#00768f" },
  { nombre: "Cian", valor: "#00c2d6" },
  { nombre: "Naranja", valor: "#ffba1f" },
  { nombre: "Verde", valor: "#1f6b43" },
];

const PROSE_CLASS =
  "prose prose-teal max-w-none min-h-[280px] rounded-b-lg border border-t-0 border-line bg-white px-3 py-2 text-sm focus:outline-none prose-headings:font-display prose-headings:text-teal-dark prose-blockquote:font-serif prose-blockquote:text-base prose-blockquote:not-italic prose-blockquote:text-ink prose-a:text-cyan";

/**
 * Editor de "contenido" (tratamientos y blog) — negrita, cursiva,
 * listas, 4 estilos de bloque (Párrafo/Título/Subtítulo/Comentado) y
 * una paleta de color acotada a los tonos de marca. Guarda HTML en un
 * input oculto con el mismo `name` que antes tenía el textarea, así
 * que las Server Actions existentes no necesitan cambios.
 *
 * El contenido ya publicado sigue en Markdown — se sigue leyendo tal
 * cual (ver ContenidoEnriquecido), este editor solo escribe HTML a
 * partir de ahora.
 */
export function EditorContenido({
  name,
  defaultValue,
}: {
  name: string;
  defaultValue?: string | null;
}) {
  const [html, setHtml] = useState(defaultValue ?? "");

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] } }),
      TextStyle,
      Color,
      Placeholder.configure({ placeholder: "Escribe el contenido…" }),
    ],
    content: defaultValue || "",
    onUpdate: ({ editor }) => setHtml(editor.getHTML()),
    editorProps: {
      attributes: { class: PROSE_CLASS },
    },
  });

  if (!editor) {
    // Antes de montar en el cliente (o sin JS) — sigue siendo un
    // campo de texto normal con el mismo name, no bloquea el envío.
    return (
      <textarea
        name={name}
        rows={16}
        defaultValue={defaultValue ?? ""}
        className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 font-mono text-xs text-ink focus:outline-none focus:ring-2 focus:ring-teal/30"
      />
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-1 rounded-t-lg border border-line bg-paper-dim px-2 py-1.5">
        <BotonEstilo
          activo={editor.isActive("paragraph")}
          onClick={() => editor.chain().focus().setParagraph().run()}
        >
          Párrafo
        </BotonEstilo>
        <BotonEstilo
          activo={editor.isActive("heading", { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          Título
        </BotonEstilo>
        <BotonEstilo
          activo={editor.isActive("heading", { level: 3 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        >
          Subtítulo
        </BotonEstilo>
        <BotonEstilo
          activo={editor.isActive("blockquote")}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          Comentado
        </BotonEstilo>

        <Separador />

        <BotonIcono
          activo={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
          label="Negrita"
        >
          <Bold className="h-4 w-4" aria-hidden />
        </BotonIcono>
        <BotonIcono
          activo={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          label="Cursiva"
        >
          <Italic className="h-4 w-4" aria-hidden />
        </BotonIcono>

        <Separador />

        <BotonIcono
          activo={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          label="Lista con viñetas"
        >
          <List className="h-4 w-4" aria-hidden />
        </BotonIcono>
        <BotonIcono
          activo={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          label="Lista numerada"
        >
          <ListOrdered className="h-4 w-4" aria-hidden />
        </BotonIcono>

        <Separador />

        <div className="flex items-center gap-1">
          {COLORES.map((c) => (
            <button
              key={c.valor}
              type="button"
              title={c.nombre}
              onClick={() => editor.chain().focus().setColor(c.valor).run()}
              className={`h-5 w-5 rounded-full ring-1 ring-inset transition ${
                editor.isActive("textStyle", { color: c.valor })
                  ? "ring-2 ring-ink"
                  : "ring-white"
              }`}
              style={{ backgroundColor: c.valor }}
            >
              <span className="sr-only">{c.nombre}</span>
            </button>
          ))}
          <button
            type="button"
            title="Quitar color"
            onClick={() => editor.chain().focus().unsetColor().run()}
            className="flex h-5 w-5 items-center justify-center rounded-full border border-line bg-white text-[10px] leading-none text-ink-soft hover:bg-paper-dim"
          >
            ×
          </button>
        </div>
      </div>

      <EditorContent editor={editor} />
      <input type="hidden" name={name} value={html} />
    </div>
  );
}

function Separador() {
  return <div className="mx-1 h-5 w-px bg-line" aria-hidden />;
}

function BotonEstilo({
  activo,
  onClick,
  children,
}: {
  activo: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-md px-2 py-1 text-xs font-medium transition ${
        activo ? "bg-teal text-paper" : "text-ink-soft hover:bg-white"
      }`}
    >
      {children}
    </button>
  );
}

function BotonIcono({
  activo,
  onClick,
  label,
  children,
}: {
  activo: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`rounded-md p-1.5 transition ${
        activo ? "bg-teal text-paper" : "text-ink-soft hover:bg-white"
      }`}
    >
      {children}
    </button>
  );
}
