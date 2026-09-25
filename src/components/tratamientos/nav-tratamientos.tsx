import Link from "next/link";
import { CATEGORIAS_TRATAMIENTO } from "@/lib/clinic-options";

type TratamientoNav = { slug: string; nombre: string; categoria: string | null };

/**
 * Todos los tratamientos, agrupados por categoría y siempre
 * desplegados (sin acordeón) — para moverse rápido de un tratamiento
 * a otro sin volver al listado. Sustituye al módulo de precio
 * orientativo en el sidebar de la ficha de tratamiento.
 */
export function NavTratamientos({
  tratamientos,
  activoSlug,
}: {
  tratamientos: TratamientoNav[];
  activoSlug: string;
}) {
  const sinCategoria = tratamientos.filter(
    (t) => !t.categoria || !(CATEGORIAS_TRATAMIENTO as readonly string[]).includes(t.categoria),
  );

  return (
    <nav aria-label="Todos los tratamientos" className="rounded-2xl border border-line bg-white p-5">
      <p className="font-display text-lg text-teal-dark">Todos los tratamientos</p>
      <div className="mt-3 flex flex-col gap-5">
        {CATEGORIAS_TRATAMIENTO.map((categoria) => {
          const deEstaCategoria = tratamientos.filter((t) => t.categoria === categoria);
          if (deEstaCategoria.length === 0) return null;
          return (
            <div key={categoria}>
              <p className="text-xs font-bold uppercase tracking-wide text-ink-soft">
                {categoria}
              </p>
              <ul className="mt-2 flex flex-col gap-1">
                {deEstaCategoria.map((t) => (
                  <li key={t.slug}>
                    <Link
                      href={`/tratamientos/${t.slug}`}
                      className={`block rounded-lg px-2.5 py-1.5 text-sm transition ${
                        t.slug === activoSlug
                          ? "bg-sage font-semibold text-sage-ink"
                          : "text-ink hover:bg-paper-dim hover:text-teal-dark"
                      }`}
                    >
                      {t.nombre}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}

        {sinCategoria.length > 0 && (
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-ink-soft">Otros</p>
            <ul className="mt-2 flex flex-col gap-1">
              {sinCategoria.map((t) => (
                <li key={t.slug}>
                  <Link
                    href={`/tratamientos/${t.slug}`}
                    className={`block rounded-lg px-2.5 py-1.5 text-sm transition ${
                      t.slug === activoSlug
                        ? "bg-sage font-semibold text-sage-ink"
                        : "text-ink hover:bg-paper-dim hover:text-teal-dark"
                    }`}
                  >
                    {t.nombre}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </nav>
  );
}
