import { descripcionHtmlSegura } from "@/lib/clinica/descripcion";
import {
  autoenlazarHtml,
  textoPlanoAHtml,
  type DestinoEnlace,
} from "@/lib/seo/enlaces-internos-html";

/**
 * Descripción de la ficha pública: respeta negritas y saltos de línea.
 * Las descripciones antiguas (texto plano) conservan sus saltos de línea.
 * Con `enlaces`, las menciones a tratamientos con página propia se
 * convierten en enlaces internos (primera aparición, máx. 4).
 */
export function DescripcionClinica({
  texto,
  className = "",
  enlaces,
}: {
  texto: string;
  className?: string;
  enlaces?: DestinoEnlace[];
}) {
  const base = descripcionHtmlSegura(texto) ?? textoPlanoAHtml(texto);
  const html = enlaces && enlaces.length > 0 ? autoenlazarHtml(base, enlaces) : base;

  return (
    <div
      className={`break-words [&_p+p]:mt-3 [&_strong]:font-semibold [&_strong]:text-ink [&_a]:font-medium [&_a]:text-cyan [&_a]:underline [&_a]:decoration-cyan/30 [&_a]:underline-offset-2 hover:[&_a]:text-cyan-dark ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
