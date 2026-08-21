import Image from "next/image";
import Link from "next/link";
import type { Clinic } from "@/lib/supabase/database.types";
import { slugifyProvincia, slugifyCiudad } from "@/lib/clinic-options";
import { ClinicBadges } from "./clinic-badges";
import { RatingCompacto } from "./rating-stars";

export function ClinicaDeLaSemana({ clinic }: { clinic: Clinic }) {
  const foto = clinic.fotos[0];
  const href = clinic.ciudad
    ? `/clinicas/${slugifyProvincia(clinic.provincia)}/${slugifyCiudad(clinic.ciudad)}/${clinic.slug}`
    : `/clinicas/${slugifyProvincia(clinic.provincia)}/sin-ciudad/${clinic.slug}`;
  const ubicacion = [clinic.zona, clinic.ciudad].filter(Boolean).join(", ");

  return (
    <section className="border-t border-line bg-paper-dim">
      <div className="mx-auto max-w-[1600px] px-6 py-14">
        <h2 className="font-display text-3xl font-extrabold text-teal-dark sm:text-4xl">
          Clínica de la semana
        </h2>
        <p className="mt-2 text-ink-soft">
          Cada semana, te presentaremos una clínica y sus servicios.
        </p>

        <Link
          href={href}
          className="card-lg press group mt-6 grid grid-cols-1 overflow-hidden border border-line bg-white transition hover:shadow-md md:grid-cols-[1fr_1.4fr]"
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

            <ClinicBadges clinic={clinic} />
          </div>

          <div className="flex flex-col justify-center p-8">
            {(clinic.logo_url || clinic.rating_google != null) && (
              <div className="mb-3 flex items-center justify-between gap-2">
                {clinic.logo_url ? (
                  <div className="relative h-[50px] w-[120px] shrink-0 rounded-lg border border-line bg-white p-1.5">
                    <Image
                      src={clinic.logo_url}
                      alt=""
                      fill
                      sizes="120px"
                      className="object-contain"
                    />
                  </div>
                ) : (
                  <span />
                )}
                <RatingCompacto rating={clinic.rating_google} />
              </div>
            )}

            <h3 className="font-display text-2xl text-teal-dark group-hover:text-cyan">
              {clinic.nombre}
            </h3>
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
            <div className="mt-6 flex justify-end">
              <span className="press btn-soft inline-block w-fit bg-gradient-to-r from-yellow to-orange text-sm font-bold text-teal-dark shadow-sm shadow-orange/20 transition group-hover:opacity-90">
                Ver ficha
              </span>
            </div>
          </div>
        </Link>
      </div>
    </section>
  );
}
