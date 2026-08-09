import Image from "next/image";
import Link from "next/link";
import type { Clinic } from "@/lib/supabase/database.types";
import { slugifyCiudad } from "@/lib/clinic-options";
import { VerifiedBadge } from "./verified-badge";

export function ClinicCard({ clinic }: { clinic: Clinic }) {
  const ubicacion = [clinic.zona, clinic.ciudad].filter(Boolean).join(", ");
  const foto = clinic.fotos[0];
  const href = clinic.ciudad
    ? `/clinicas/${slugifyCiudad(clinic.ciudad)}/${clinic.slug}`
    : `/clinicas/sin-ciudad/${clinic.slug}`;

  return (
    <Link
      href={href}
      className={`group flex flex-col overflow-hidden rounded-2xl border transition hover:shadow-[0_8px_28px_-12px_rgba(31,58,46,0.25)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal ${
        clinic.destacado
          ? "border-cyan/50 bg-cyan/5 hover:border-cyan"
          : "border-line bg-white/60 hover:border-teal/40"
      }`}
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-sage">
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

        {clinic.verificado && (
          <VerifiedBadge variant="photo" className="absolute left-3 top-3" />
        )}

        {(clinic.destacado || clinic.tiene_oferta || clinic.plan === "premium") && (
          <div className="absolute right-3 top-3 flex flex-col items-end gap-1.5">
            {clinic.destacado && (
              <span className="rounded-full bg-teal px-2.5 py-1 text-xs font-medium text-white shadow-sm">
                ★ Destacada
              </span>
            )}
            {clinic.plan === "premium" && (
              <span className="rounded-full bg-cyan-dark px-2.5 py-1 text-xs font-medium text-white shadow-sm">
                ✦ Premium
              </span>
            )}
            {clinic.tiene_oferta && (
              <span className="rounded-full bg-cyan px-2.5 py-1 text-xs font-medium text-white shadow-sm">
                Oferta
              </span>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div>
          <h3 className="font-display text-lg leading-snug text-teal-dark">
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

        {clinic.descripcion && (
          <p className="line-clamp-2 text-sm text-ink-soft">
            {clinic.descripcion}
          </p>
        )}

        {clinic.tecnicas.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
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

        <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 pt-2 text-xs text-ink-soft">
          {clinic.primera_consulta_gratis && <span>1ª consulta gratis</span>}
          {clinic.financiacion && <span>Financiación disponible</span>}
        </div>

        <span className="text-sm font-medium text-cyan group-hover:text-cyan-dark">
          Ver ficha →
        </span>
      </div>
    </Link>
  );
}
