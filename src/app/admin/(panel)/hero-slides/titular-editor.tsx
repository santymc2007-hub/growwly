"use client";

import { useRef } from "react";

/**
 * Editor "WYSIWYG" mínimo y de marca: contentEditable con solo dos
 * acciones (negrita y resaltado amarillo, el mismo que ya usa toda
 * la web). Nunca permite fuente, tamaño o color libres, para que
 * ninguna slide se pueda salir de la línea gráfica.
 */
export function TitularEditor({
  name,
  defaultValueHtml,
}: {
  name: string;
  defaultValueHtml?: string;
}) {
  const editorRef = useRef<HTMLDivElement>(null);
  const hiddenRef = useRef<HTMLInputElement>(null);

  function sync() {
    if (editorRef.current && hiddenRef.current) {
      hiddenRef.current.value = editorRef.current.innerHTML;
    }
  }

  function aplicar(comando: "bold" | "hl") {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
      return;
    }
    const range = selection.getRangeAt(0);
    if (
      !editorRef.current ||
      !editorRef.current.contains(range.commonAncestorContainer)
    ) {
      return;
    }

    const contenido = range.extractContents();
    const wrapper = document.createElement(comando === "bold" ? "b" : "span");
    if (comando === "hl") wrapper.className = "hl";
    wrapper.appendChild(contenido);
    range.insertNode(wrapper);
    selection.removeAllRanges();
    sync();
  }

  function quitarFormato() {
    if (!editorRef.current) return;
    editorRef.current.textContent = editorRef.current.textContent ?? "";
    sync();
  }

  return (
    <div>
      <div className="mb-1.5 flex gap-1.5">
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => aplicar("bold")}
          className="rounded-lg border border-line bg-white px-3 py-1.5 text-sm font-bold text-ink hover:bg-paper-dim"
        >
          N
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => aplicar("hl")}
          className="rounded-lg border border-line bg-yellow px-3 py-1.5 text-sm font-medium text-teal-dark hover:opacity-90"
        >
          Resaltar
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={quitarFormato}
          className="rounded-lg border border-line bg-white px-3 py-1.5 text-sm text-ink-soft hover:bg-paper-dim"
        >
          Quitar formato
        </button>
      </div>
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={sync}
        onBlur={sync}
        className="hero-titular-editor min-h-[3.5rem] rounded-lg border border-line bg-white px-3 py-2.5 font-display text-2xl leading-snug text-teal-dark focus:outline-none focus:ring-2 focus:ring-teal/30"
        dangerouslySetInnerHTML={{ __html: defaultValueHtml || "" }}
      />
      <input
        ref={hiddenRef}
        type="hidden"
        name={name}
        defaultValue={defaultValueHtml || ""}
      />
      <p className="mt-1 text-xs text-ink-soft">
        Selecciona texto y pulsa un botón para darle formato — se ve tal
        cual va a salir en la web.
      </p>
    </div>
  );
}
