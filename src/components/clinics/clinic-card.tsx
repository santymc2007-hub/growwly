import Image from "next/image";
import Link from "next/link";
import type { Clinic } from "@/lib/supabase/database.types";
import { slugifyCiudad, slugifyProvincia } from "@/lib/clinic-options";
import { ClinicBadges } from "./clinic-badges";
import { RatingCompacto } from "./rating-stars";

const DESCRIPCION_MAX = 100;

function truncar(texto: string, max: number) {
  if (texto.length <= max) return texto;
  const cortado = texto.slice(0, max);
  const ultimoEspacio = cortado.lastIndexOf(" ");
  return (ultimoEspacio > 0 ? cortado.slice(0, ultimoEspacio) : cortado).trimEnd() + "…";
}

export function ClinicCard({ clinic }: { clinic: Clinic }) {
  const ubicacion = [clinic.zona, clinic.ciudad].filter(Boolean).join(", ");
  const foto = clinic.fotos[0];
  const descripcionCorta = clinic.descripcion
    ? truncar(clinic.descripcion, DESCRIPCION_MAX)
    : null;
  const provinciaSlug = slugifyProvincia(clinic.provincia);
  const href = clinic.ciudad
    ? `/clinicas/${provinciaSlug}/${slugifyCiudad(clinic.ciudad)}/${clinic.slug}`
    : `/clinicas/${provinciaSlug}/sin-ciudad/${clinic.slug}`;

  return (
    <Link
      href={href}
      className="group flex flex-col overflow-hidden rounded-2xl border border-line bg-white/60 transition hover:border-teal/40 hover:shadow-[0_8px_28px_-12px_rgba(31,58,46,0.25)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-sage lg:aspect-auto lg:h-[200px]">
        {foto ? (
          <Image
            src={foto}
            alt={clinic.nombre}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-sage-ink">
            Sin foto todavía
          </div>
        )}

        <ClinicBadges clinic={clinic} />
      </div>

      <div className="flex flex-1 flex-col gap-2 p-2.5 sm:gap-2.5 sm:p-4">
        {(clinic.logo_url || clinic.rating_google != null) && (
          <div className="flex items-center justify-between gap-2">
            {clinic.logo_url ? (
              <div className="relative h-9 w-20 shrink-0 rounded-lg border border-line bg-white p-1.5 sm:h-[50px] sm:w-[120px]">
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

        <div>
          <h3 className="font-display text-sm leading-snug text-teal-dark sm:text-lg">
            {clinic.nombre}
          </h3>
          {ubicacion && (
            <p className="mt-0.5 text-sm text-ink-soft">{ubicacion}</p>
          )}
          {clinic.tipo_negocio && (
            <p className="mt-0.5 text-xs uppercase tracking-wide text-ink-soft/70">
              {clinic.tipo_negocio}
            </p>
          )}
        </div>

        {descripcionCorta && (
          <p className="hidden line-clamp-2 text-sm text-ink-soft sm:block">
            {descripcionCorta}
          </p>
        )}

        {clinic.tecnicas.length > 0 && (
          <div className="hidden flex-wrap gap-1.5 sm:flex">
            {clinic.tecnicas.slice(0, 3).map((tecnica) => (
              <span
                key={tecnica}
                className="rounded-full bg-sage px-2.5 py-1 text-xs font-medium text-sage-ink"
              >
                {tecnica}
              </span>
            ))}
          </div>
        )}

        <div className="mt-auto flex items-center justify-between gap-3 pt-2">
          <div className="flex flex-wrap items-center gap-1.5">
            {clinic.primera_consulta_gratis && (
              <span className="rounded-full bg-cyan/10 px-2.5 py-1 text-xs font-semibold text-cyan-dark">
                1ª consulta gratis
              </span>
            )}
            {clinic.financiacion && (
              <span className="rounded-full bg-cyan/10 px-2.5 py-1 text-xs font-semibold text-cyan-dark">
                Financiación disponible
              </span>
            )}
          </div>
          <span className="press hidden shrink-0 rounded-full bg-yellow px-4 py-1.5 text-sm font-bold text-teal-dark shadow-sm shadow-yellow/30 transition group-hover:opacity-90 sm:inline-block">
            Ver ficha
          </span>
        </div>
      </div>
    </Link>
  );
}
