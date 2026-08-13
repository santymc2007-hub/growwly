import Image from "next/image";
import type { ClinicaDisponible } from "@/lib/clinica/contexto-activo";
import { seleccionarClinicaActiva } from "@/lib/clinica/acciones-grupo";

export function SelectorClinica({
  clinicas,
  clinicaActivaId,
}: {
  clinicas: ClinicaDisponible[];
  clinicaActivaId: string;
}) {
  if (clinicas.length <= 1) return null;

  return (
    <div className="mb-6 rounded-2xl border border-line bg-white p-3">
      <p className="mb-2 px-1 text-xs font-medium text-ink-soft">
        Gestionas {clinicas.length} clínicas — ¿cuál quieres ver ahora?
      </p>
      <div className="flex flex-wrap gap-2">
        {clinicas.map((c) => {
          const activa = c.id === clinicaActivaId;
          return (
            <form key={c.id} action={seleccionarClinicaActiva}>
              <input type="hidden" name="clinicId" value={c.id} />
              <button
                type="submit"
                disabled={activa}
                className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition ${
                  activa
                    ? "border-teal bg-teal text-paper"
                    : "border-line bg-white text-ink hover:border-teal/40"
                }`}
              >
                {c.logo_url ? (
                  <span className="relative h-5 w-5 overflow-hidden rounded-full bg-sage">
                    <Image src={c.logo_url} alt="" fill sizes="20px" className="object-cover" />
                  </span>
                ) : (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-sage text-[10px] font-bold text-sage-ink">
                    {c.nombre.charAt(0)}
                  </span>
                )}
                {c.nombre}
              </button>
            </form>
          );
        })}
      </div>
    </div>
  );
}
