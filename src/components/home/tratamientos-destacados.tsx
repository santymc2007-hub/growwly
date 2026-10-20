import Link from "next/link";
import Image from "next/image";
import { Camera, Syringe, Scissors, Sparkles, type LucideIcon } from "lucide-react";

type TratamientoDestacado = {
  slug: string;
  nombre: string;
  categoria: string | null;
  imagen_portada: string | null;
  resumen: string | null;
};

const ICONO_POR_CATEGORIA: Record<string, LucideIcon> = {
  "Diagnóstico y consulta": Camera,
  "Tratamientos médicos": Syringe,
  "Injerto capilar": Scissors,
  "Estética capilar": Sparkles,
};

const GRADIENTE_POR_CATEGORIA: Record<string, string> = {
  "Diagnóstico y consulta": "from-teal-dark to-cyan-dark",
  "Tratamientos médicos": "from-cyan-dark to-brand-blue",
  "Injerto capilar": "from-brand-green to-teal-dark",
  "Estética capilar": "from-orange to-teal-dark",
};
const GRADIENTE_DEFECTO = "from-teal-dark to-cyan-dark";

export function TratamientosDestacados({
  tratamientos,
}: {
  tratamientos: TratamientoDestacado[];
}) {
  if (tratamientos.length === 0) return null;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 data-reveal className="font-display text-4xl font-extrabold text-teal-dark">
            Tratamientos capilares más demandados
          </h2>
          <p className="mt-3 max-w-2xl text-lg text-ink-soft">
            Descubre los tratamientos más solicitados y encuentra la clínica
            que mejor se adapta a ti.
          </p>
        </div>
        <Link
          href="/tratamientos"
          className="press shrink-0 rounded-full bg-yellow px-5 py-2.5 text-sm font-bold text-teal-dark shadow-sm transition hover:opacity-90"
        >
          Ver todos los tratamientos →
        </Link>
      </div>

      <div data-reveal-grupo className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {tratamientos.map((t) => {
          const Icono = (t.categoria && ICONO_POR_CATEGORIA[t.categoria]) || Sparkles;
          const gradiente =
            (t.categoria && GRADIENTE_POR_CATEGORIA[t.categoria]) ||
            GRADIENTE_DEFECTO;
          return (
            <Link
              key={t.slug}
              href={`/tratamientos/${t.slug}`}
              className="press group flex flex-col overflow-hidden rounded-2xl transition hover:opacity-95"
            >
              <div className="relative h-40 w-full">
                {t.imagen_portada ? (
                  <Image
                    src={t.imagen_portada}
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                    className="object-cover"
                  />
                ) : (
                  <div className={`absolute inset-0 bg-gradient-to-br ${gradiente}`} />
                )}
              </div>

              <div className={`relative flex-1 bg-gradient-to-br ${gradiente} px-5 pb-5 pt-8`}>
                <span className="absolute -top-6 left-5 flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-md">
                  <Icono className="h-5 w-5 text-teal-dark" aria-hidden />
                </span>
                <h3 className="font-display text-lg font-extrabold leading-tight text-white">
                  {t.nombre}
                </h3>
                {t.resumen && (
                  <p className="mt-1 text-sm text-white/80">{t.resumen}</p>
                )}
                {/* Toda la tarjeta es el enlace; el "botón" lo hace visible
                    con el amarillo de los CTA de la web. */}
                <span className="mt-4 inline-block rounded-full bg-yellow px-4 py-1.5 text-sm font-bold text-teal-dark shadow-sm transition group-hover:opacity-90">
                  Ver más →
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
