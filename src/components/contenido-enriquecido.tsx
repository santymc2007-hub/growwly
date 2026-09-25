import ReactMarkdown from "react-markdown";

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
 * migrar datos: si es HTML se sanea con DOMPurify y se pinta tal
 * cual; si no, sigue pasando por ReactMarkdown como siempre.
 *
 * isomorphic-dompurify se importa de forma perezosa (solo cuando el
 * contenido es realmente HTML) porque, al cargarse, inicializa un
 * jsdom completo — un peso y una superficie de fallo que no tiene
 * sentido pagar en cada ficha de tratamiento o post cuando, de
 * momento, ninguno usa todavía el HTML del editor nuevo.
 */
export async function ContenidoEnriquecido({
  contenido,
}: {
  contenido: string;
}) {
  if (esHtml(contenido)) {
    const { default: DOMPurify } = await import("isomorphic-dompurify");
    const limpio = DOMPurify.sanitize(contenido, {
      ALLOWED_TAGS,
      ALLOWED_ATTR,
    });
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
