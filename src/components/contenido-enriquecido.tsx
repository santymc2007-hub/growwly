import ReactMarkdown from "react-markdown";
import sanitizeHtml from "sanitize-html";

const PROSE_CLASS =
  "prose prose-teal mt-8 max-w-none prose-headings:font-display prose-headings:text-teal-dark prose-a:text-cyan prose-blockquote:font-serif prose-blockquote:text-lg prose-blockquote:not-italic prose-blockquote:text-ink";

const ALLOWED_TAGS = [
  "p",
  "h2",
  "h3",
  "strong",
  "em",
  "ul",
  "ol",
  "li",
  "blockquote",
  "br",
  "span",
  "a",
  "code",
  "pre",
];
const ALLOWED_ATTR = ["style", "href", "target", "rel", "data-estilo"];

const SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: ALLOWED_TAGS,
  allowedAttributes: { "*": ALLOWED_ATTR },
  // Los estilos que guarda el editor son CSS inline literal (ver
  // estilo-texto-mark.ts) — se permiten las propiedades concretas que
  // usa, en vez de abrir "style" a cualquier valor.
  allowedStyles: {
    "*": {
      color: [/^#[0-9a-fA-F]{3,8}$/, /^rgb\(.*\)$/],
      "font-family": [/.*/],
      "font-weight": [/.*/],
      "font-size": [/.*/],
      "font-style": [/.*/],
      "line-height": [/.*/],
    },
  },
};

export function esHtml(contenido: string): boolean {
  return /<[a-z][\s\S]*>/i.test(contenido);
}

/**
 * Renderiza el campo "contenido" de un tratamiento o post del blog.
 *
 * Antes del editor enriquecido (EditorContenido), todo se escribía a
 * mano en Markdown. Ahora el editor guarda HTML. Para no romper nada
 * ya publicado, se detecta el formato por contenido (¿tiene alguna
 * etiqueta HTML?) en vez de depender de una columna nueva o de
 * migrar datos: si es HTML se sanea y se pinta tal cual; si no, sigue
 * pasando por ReactMarkdown como siempre.
 *
 * Se sanea con sanitize-html (puro JS, sin dependencias nativas) y no
 * con isomorphic-dompurify: ese paquete inicializa un jsdom completo
 * en cuanto se importa, y jsdom es una fuente habitual de fallos al
 * desplegar en funciones serverless de Vercel (archivos que su
 * empaquetado no traza correctamente, como xhr-sync-worker.js).
 */
export function ContenidoEnriquecido({ contenido }: { contenido: string }) {
  if (esHtml(contenido)) {
    const limpio = sanitizeHtml(contenido, SANITIZE_OPTIONS);
    return (
      <div
        className={PROSE_CLASS}
        dangerouslySetInnerHTML={{ __html: limpio }}
      />
    );
  }

  return (
    <div className={PROSE_CLASS}>
      <ReactMarkdown>{contenido}</ReactMarkdown>
    </div>
  );
}
