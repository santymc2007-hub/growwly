import Link from "next/link";

/**
 * Lista de etiquetas como pastillas enlazadas a /blog?tag=X — se usa
 * tanto para "todas las etiquetas" (listado) como para "etiquetas de
 * este post" (detalle, donde además sirven de navegación a otros
 * artículos relacionados).
 */
export function EtiquetasBlog({
  tags,
  activa,
}: {
  tags: string[];
  activa?: string;
}) {
  if (tags.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      {tags.map((tag) => {
        const esActiva = tag === activa;
        return (
          <Link
            key={tag}
            href={esActiva ? "/blog" : `/blog?tag=${encodeURIComponent(tag)}`}
            className={`rounded-full px-3 py-1 text-xs font-medium transition ${
              esActiva
                ? "bg-teal text-paper"
                : "bg-paper-dim text-ink-soft hover:bg-sage hover:text-sage-ink"
            }`}
          >
            {tag}
          </Link>
        );
      })}
    </div>
  );
}
