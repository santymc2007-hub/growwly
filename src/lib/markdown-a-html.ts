import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";

const procesador = unified()
  .use(remarkParse)
  .use(remarkRehype)
  .use(rehypeStringify);

/**
 * Convierte Markdown a HTML con el mismo parser (remark, CommonMark)
 * que usa ReactMarkdown para pintar el contenido antiguo en público.
 * Necesario porque Tiptap interpreta su prop `content` como HTML: si
 * se le pasa Markdown en crudo, lo mete todo en un único párrafo con
 * los asteriscos y `#` literales en vez de negrita/títulos reales.
 */
export function markdownAHtml(markdown: string): string {
  return procesador.processSync(markdown).toString();
}
