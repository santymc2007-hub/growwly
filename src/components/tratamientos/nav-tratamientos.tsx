import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { CATEGORIAS_TRATAMIENTO } from "@/lib/clinic-options";

type TratamientoNav = { slug: string; nombre: string; categoria: string | null };

function ListaTratamientos({
  tratamientos,
  activoSlug,
}: {
  tratamientos: TratamientoNav[];
  activoSlug: string;
}) {
  return (
    <ul className="mt-2 flex flex-col gap-1">
      {tratamientos.map((t) => (
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
  );
}

/**
 * Todos los tratamientos, agrupados por categoría — para moverse rápido
 * de un tratamiento a otro sin volver al listado.
 *
 * Escritorio: siempre desplegados. Móvil y tablet: cada categoría es un
 * acordeón cerrado; desplegados ocupaban tanto que había que hacer mucho
 * scroll para llegar a los centros.
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

  const grupos = [
    ...CATEGORIAS_TRATAMIENTO.map((categoria) => ({
      nombre: categoria as string,
      items: tratamientos.filter((t) => t.categoria === categoria),
    })),
    { nombre: "Otros", items: sinCategoria },
  ].filter((g) => g.items.length > 0);

  return (
    <nav aria-label="Todos los tratamientos" className="rounded-2xl border border-line bg-white p-5">
      <p className="font-display text-lg text-teal-dark">Todos los tratamientos</p>

      {/* Escritorio */}
      <div className="mt-3 hidden flex-col gap-5 lg:flex">
        {grupos.map((g) => (
          <div key={g.nombre}>
            <p className="text-xs font-bold uppercase tracking-wide text-ink-soft">{g.nombre}</p>
            <ListaTratamientos tratamientos={g.items} activoSlug={activoSlug} />
          </div>
        ))}
      </div>

      {/* Móvil y tablet: acordeón, todo cerrado */}
      <div className="mt-2 divide-y divide-line lg:hidden">
        {grupos.map((g) => (
          <details key={g.nombre} className="group">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 py-3 [&::-webkit-details-marker]:hidden">
              <span className="text-xs font-bold uppercase tracking-wide text-ink-soft">
                {g.nombre}
                <span className="ml-1.5 font-semibold normal-case tracking-normal text-ink-soft/70">
                  ({g.items.length})
                </span>
              </span>
              <ChevronDown
                className="h-4 w-4 shrink-0 text-ink-soft transition-transform group-open:rotate-180"
                aria-hidden
              />
            </summary>
            <div className="pb-3">
              <ListaTratamientos tratamientos={g.items} activoSlug={activoSlug} />
            </div>
          </details>
        ))}
      </div>
    </nav>
  );
}
