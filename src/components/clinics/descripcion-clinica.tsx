import { descripcionHtmlSegura } from "@/lib/clinica/descripcion";

/**
 * Descripción de la ficha pública: respeta negritas y saltos de línea.
 * Las descripciones antiguas (texto plano) conservan sus saltos de línea.
 */
export function DescripcionClinica({
  texto,
  className = "",
}: {
  texto: string;
  className?: string;
}) {
  const html = descripcionHtmlSegura(texto);

  if (!html) {
    return <p className={`whitespace-pre-line break-words ${className}`}>{texto}</p>;
  }

  return (
    <div
      className={`break-words [&_p+p]:mt-3 [&_strong]:font-semibold [&_strong]:text-ink ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
