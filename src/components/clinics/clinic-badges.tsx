import { Percent, Sparkles } from "lucide-react";
import type { Clinic } from "@/lib/supabase/database.types";
import { VerifiedBadge } from "./verified-badge";

type ClinicBadgesProps = {
  clinic: Pick<Clinic, "verificado" | "plan" | "tiene_oferta">;
};

/** Stack de badges arriba-derecha de la foto: Verificada, Perfil
 *  detallado (si plan premium) y Oferta, siempre en ese orden. */
export function ClinicBadges({ clinic }: ClinicBadgesProps) {
  const tienePerfilDetallado = clinic.plan === "premium";

  if (!clinic.verificado && !tienePerfilDetallado && !clinic.tiene_oferta) {
    return null;
  }

  return (
    <div className="absolute right-3 top-3 flex flex-col items-end gap-1.5">
      {clinic.verificado && <VerifiedBadge variant="photo" />}

      {tienePerfilDetallado && (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1 text-xs font-medium text-cyan-dark shadow-sm">
          {/* TODO: Santy quiere sustituir este icono más adelante */}
          <Sparkles className="h-3.5 w-3.5" aria-hidden />
          Perfil detallado
        </span>
      )}

      {clinic.tiene_oferta && (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1 text-xs font-medium text-ink shadow-sm">
          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-error text-white">
            <Percent className="h-2.5 w-2.5" aria-hidden />
          </span>
          Oferta
        </span>
      )}
    </div>
  );
}
