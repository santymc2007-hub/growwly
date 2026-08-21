import Image from "next/image";
import Link from "next/link";
import type { Clinic } from "@/lib/supabase/database.types";
import { slugifyCiudad, slugifyProvincia } from "@/lib/clinic-options";
import { ClinicBadges } from "./clinic-badges";
import { RatingCompacto } from "./rating-stars";

/**
 * Versión reducida de ClinicCard para cuando el mapa está activo (menos
 * ancho disponible en la lista): solo foto+badges, logo+rating, nombre,
 * ciudad, técnicas y botón. Sin descripción, sin tipo de negocio, sin
 * financiación/consulta gratis.
 */
export function ClinicCardCompact({ clinic }: { clinic: Clinic }) {
  const foto = clinic.fotos[0];
  const provinciaSlug = slugifyProvincia(clinic.provincia);
  const href = clinic.ciudad
    ? `/clinicas/${provinciaSlug}/${slugifyCiudad(clinic.ciudad)}/${clinic.slug}`
    : `/clinicas/${provinciaSlug}/sin-ciudad/${clinic.slug}`;

  return (
    <Link
      href={href}
      className="group flex flex-col overflow-hidden rounded-xl border border-line bg-white/60 transition hover:border-teal/40 hover:shadow-[0_8px_28px_-12px_rgba(31,58,46,0.25)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-sage">
        {foto ? (
          <Image
            src={foto}
            alt={clinic.nombre}
            fill
            sizes="(min-width: 1280px) 20vw, (min-width: 1024px) 25vw, 50vw"
            className="object-cover transition duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-sage-ink">
            Sin foto
          </div>
        )}
        <ClinicBadges clinic={clinic} />
      </div>

      <div className="flex flex-1 flex-col gap-2 p-3">
        {(clinic.logo_url || clinic.rating_google != null) && (
          <div className="flex items-center justify-between gap-2">
            {clinic.logo_url ? (
              <div className="relative h-9 w-[90px] shrink-0 rounded-md border border-line bg-white p-1">
                <Image
                  src={clinic.logo_url}
                  alt=""
                  fill
                  sizes="90px"
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
          <h3 className="font-display text-sm font-bold leading-snug text-teal-dark">
            {clinic.nombre}
          </h3>
          {clinic.ciudad && (
            <p className="mt-0.5 text-xs text-ink-soft">{clinic.ciudad}</p>
          )}
        </div>

        {clinic.tecnicas.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {clinic.tecnicas.slice(0, 2).map((tecnica) => (
              <span
                key={tecnica}
                className="rounded-full bg-sage px-2 py-0.5 text-[11px] font-medium text-sage-ink"
              >
                {tecnica}
              </span>
            ))}
          </div>
        )}

        <span className="press mt-auto inline-block w-fit rounded-full bg-gradient-to-r from-yellow to-orange px-3 py-1 text-xs font-bold text-teal-dark shadow-sm shadow-orange/20 transition group-hover:opacity-90">
          Ver ficha
        </span>
      </div>
    </Link>
  );
}
