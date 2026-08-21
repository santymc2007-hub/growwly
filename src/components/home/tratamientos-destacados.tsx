import Link from "next/link";
import Image from "next/image";

type TratamientoDestacado = {
  slug: string;
  nombre: string;
  categoria: string | null;
  imagen_portada: string | null;
};

const GRADIENTE_POR_CATEGORIA: Record<string, string> = {
  "Diagnóstico y consulta": "from-teal-dark to-cyan",
  "Tratamientos médicos": "from-cyan-dark to-brand-blue",
  "Injerto capilar": "from-brand-green to-brand-blue",
  "Estética capilar": "from-yellow to-orange",
};
const GRADIENTE_DEFECTO = "from-teal-dark to-cyan";

export function TratamientosDestacados({
  tratamientos,
}: {
  tratamientos: TratamientoDestacado[];
}) {
  if (tratamientos.length === 0) return null;

  return (
    <section className="mx-auto max-w-[1600px] px-6 py-16">
      <h2 className="font-display text-4xl font-extrabold text-teal-dark">
        Tratamientos capilares más demandados
      </h2>
      <p className="mt-3 max-w-2xl text-lg text-ink-soft">
        Qué son, para quién están indicados y cómo es el proceso — explicado
        antes de que pidas presupuesto a ninguna clínica.
      </p>

      <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {tratamientos.map((t) => {
          const gradiente =
            (t.categoria && GRADIENTE_POR_CATEGORIA[t.categoria]) ||
            GRADIENTE_DEFECTO;
          return (
            <Link
              key={t.slug}
              href={`/tratamientos/${t.slug}`}
              className="press group relative flex aspect-[3/4] flex-col justify-end overflow-hidden rounded-2xl p-5 transition hover:opacity-95"
            >
              {t.imagen_portada ? (
                <>
                  <Image
                    src={t.imagen_portada}
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                    className="object-cover"
                  />
                  <div
                    className={`absolute inset-0 bg-gradient-to-t opacity-75 ${gradiente}`}
                  />
                </>
              ) : (
                <div className={`absolute inset-0 bg-gradient-to-br ${gradiente}`} />
              )}

              <div className="relative">
                {t.categoria && (
                  <span className="text-xs font-semibold uppercase tracking-wide text-white/80">
                    {t.categoria}
                  </span>
                )}
                <h3 className="mt-1 font-display text-xl font-extrabold leading-tight text-white">
                  {t.nombre}
                </h3>
                <span className="press mt-4 inline-block rounded-full bg-white px-4 py-2 text-sm font-bold text-teal-dark transition group-hover:opacity-90">
                  Leer más
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
