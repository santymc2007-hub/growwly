import { Mark, mergeAttributes } from "@tiptap/core";

export type TipoEstiloTexto = "titulo" | "subtitulo" | "comentado";

/**
 * Estilos con CSS inline literal (no var(--...)) para que sobrevivan
 * tal cual al guardarse como HTML y renderizarse en ContenidoEnriquecido,
 * sin depender de que las custom properties del sitio estén disponibles
 * en cualquier contexto donde se pinte ese HTML.
 */
export const ESTILOS_TEXTO: Record<TipoEstiloTexto, string> = {
  titulo:
    "font-family:'Bricolage Grotesque',sans-serif;font-weight:800;font-size:1.5em;line-height:1.25;color:#1f5568;",
  subtitulo:
    "font-family:'Bricolage Grotesque',sans-serif;font-weight:700;font-size:1.2em;line-height:1.3;color:#1f5568;",
  comentado:
    "font-family:'Lora',Georgia,serif;font-style:italic;color:#33403f;",
};

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    estiloTexto: {
      setEstiloTexto: (tipo: TipoEstiloTexto) => ReturnType;
      unsetEstiloTexto: () => ReturnType;
    };
  }
}

/**
 * Marca en línea (no de bloque) para Título/Subtítulo/Comentado: se
 * aplica sobre el texto seleccionado, igual que negrita o color, en
 * vez de convertir todo el párrafo en un nodo de encabezado o cita.
 * "Párrafo" es simplemente quitar esta marca.
 */
export const EstiloTexto = Mark.create({
  name: "estiloTexto",

  addAttributes() {
    return {
      tipo: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-estilo"),
        renderHTML: (attributes) => {
          const tipo = attributes.tipo as TipoEstiloTexto | null;
          if (!tipo || !ESTILOS_TEXTO[tipo]) return {};
          return { "data-estilo": tipo, style: ESTILOS_TEXTO[tipo] };
        },
      },
    };
  },

  parseHTML() {
    return [{ tag: "span[data-estilo]" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["span", mergeAttributes(HTMLAttributes), 0];
  },

  addCommands() {
    return {
      setEstiloTexto:
        (tipo: TipoEstiloTexto) =>
        ({ commands }) =>
          commands.setMark(this.name, { tipo }),
      unsetEstiloTexto:
        () =>
        ({ commands }) =>
          commands.unsetMark(this.name),
    };
  },
});
