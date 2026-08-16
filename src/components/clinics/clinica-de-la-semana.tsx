import Image from "next/image";
import Link from "next/link";
import type { Clinic } from "@/lib/supabase/database.types";
import { slugifyProvincia, slugifyCiudad } from "@/lib/clinic-options";

export function ClinicaDeLaSemana({ clinic }: { clinic: Clinic }) {
  const foto = clinic.fotos[0];
  const href = clinic.ciudad
    ? `/clinicas/${slugifyProvincia(clinic.provincia)}/${slugifyCiudad(clinic.ciudad)}/${clinic.slug}`
    : `/clinicas/${slugifyProvincia(clinic.provincia)}/sin-ciudad/${clinic.slug}`;
  const ubicacion = [clinic.zona, clinic.ciudad].filter(Boolean).join(", ");

  return (
    <section className="border-t border-line bg-paper">
      <div className="mx-auto max-w-[1600px] px-6 py-14">
        <p className="mb-5 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-yellow to-orange px-4 py-1.5 text-sm font-bold text-teal-dark">
          ⭐ Clínica destacada de la semana
        </p>

        <Link
          href={href}
          className="press group grid grid-cols-1 overflow-hidden rounded-3xl border border-line bg-white shadow-sm transition hover:shadow-md md:grid-cols-[1fr_1.4fr]"
        >
          <div className="relative aspect-video bg-sage md:aspect-auto">
            {foto ? (
              <Image
                src={foto}
                alt={clinic.nombre}
                fill
                sizes="(min-width: 768px) 640px, 100vw"
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-sage-ink">
                {clinic.nombre}
              </div>
            )}
          </div>

          <div className="flex flex-col justify-center p-8">
            {clinic.logo_url && (
              <div className="relative mb-3 h-12 w-12 overflow-hidden rounded-full border border-line">
                <Image src={clinic.logo_url} alt="" fill sizes="48px" className="object-cover" />
              </div>
            )}
            <h2 className="font-display text-2xl text-teal-dark group-hover:text-cyan">
              {clinic.nombre}
            </h2>
            {ubicacion && <p className="mt-1 text-ink-soft">{ubicacion}</p>}
            {clinic.descripcion && (
              <p className="mt-3 max-w-xl text-ink-soft">{clinic.descripcion}</p>
            )}
            {clinic.tecnicas.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {clinic.tecnicas.slice(0, 5).map((t) => (
                  <span
                    key={t}
                    className="rounded-full bg-sage px-3 py-1 text-xs font-medium text-sage-ink"
                  >
                    {t}
                  </span>
                ))}
              </div>
            )}
            <span className="mt-6 inline-block w-fit rounded-full bg-teal px-5 py-2.5 text-sm font-medium text-paper transition group-hover:bg-teal-dark">
              Ver ficha →
            </span>
          </div>
        </Link>
      </div>
    </section>
  );
}
