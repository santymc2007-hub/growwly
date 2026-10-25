import { BadgeCheck, Clock } from "lucide-react";
import type { Clinic } from "@/lib/supabase/database.types";
import { datosVerificacionCompletos } from "@/lib/clinica/verificacion";

const inputClass =
  "mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-teal/30";
const labelClass = "text-sm font-medium text-ink";

/**
 * Panel de la clínica: los datos que pide el sello «Verificado por
 * Growwly» juntos en un recuadro, con el estado de la verificación.
 */
export function RecuadroVerificacion({
  clinic,
}: {
  clinic: Pick<
    Clinic,
    "registro_sanitario" | "medico_responsable" | "colegiado_responsable" | "verificado" | "verificado_en"
  >;
}) {
  const completos = datosVerificacionCompletos(clinic);
  const fecha = clinic.verificado_en
    ? new Date(clinic.verificado_en).toLocaleDateString("es-ES", { timeZone: "Europe/Madrid" })
    : null;

  return (
    <section className="rounded-2xl border-2 border-teal/30 bg-sage/40 p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 font-display text-base text-teal-dark">
          <BadgeCheck className="h-5 w-5 text-green" aria-hidden />
          Sello «Verificado por Growwly»
        </h3>
        {clinic.verificado ? (
          <span className="rounded-full bg-green/15 px-3 py-1 text-xs font-semibold text-teal-dark">
            Verificado{fecha ? ` el ${fecha}` : ""}
          </span>
        ) : completos ? (
          <span className="flex items-center gap-1 rounded-full bg-yellow/40 px-3 py-1 text-xs font-semibold text-ink">
            <Clock className="h-3.5 w-3.5" aria-hidden />
            Pendiente de validación
          </span>
        ) : (
          <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-ink-soft">
            Faltan datos
          </span>
        )}
      </div>

      <p className="mt-2 text-xs leading-relaxed text-ink-soft">
        Para obtener el sello, facilita el número de registro sanitario del centro y el nombre y
        número de colegiado de su médico responsable. Growwly comprobará estos datos en los
        registros públicos (Registro General de Centros, Servicios y Establecimientos Sanitarios y
        Colegio Oficial de Médicos), junto con la dirección, el teléfono, el email y la web que
        figuran en esta ficha.
      </p>

      <div className="mt-4 grid gap-4">
        <div>
          <label className={labelClass} htmlFor="registro_sanitario">
            Nº de registro sanitario del centro
          </label>
          <p className="mt-0.5 text-xs text-ink-soft">
            El número de autorización de tu centro en el registro de centros sanitarios de tu
            comunidad. Obligatorio si haces tratamientos médicos (injerto, PRP, mesoterapia…). Se
            muestra en tu ficha.
          </p>
          <input
            id="registro_sanitario"
            name="registro_sanitario"
            defaultValue={clinic.registro_sanitario ?? undefined}
            className={`${inputClass} mt-2`}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass} htmlFor="medico_responsable">
              Médico responsable
            </label>
            <input
              id="medico_responsable"
              name="medico_responsable"
              placeholder="Nombre y apellidos"
              defaultValue={clinic.medico_responsable ?? undefined}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="colegiado_responsable">
              Nº de colegiado
            </label>
            <input
              id="colegiado_responsable"
              name="colegiado_responsable"
              defaultValue={clinic.colegiado_responsable ?? undefined}
              className={inputClass}
            />
          </div>
        </div>
      </div>

      <p className="mt-4 border-t border-teal/15 pt-3 text-[11px] leading-relaxed text-ink-soft">
        Al guardar estos datos declaras que son veraces y que estás autorizado para facilitarlos en
        nombre del centro. Si cambias alguno de ellos, o la dirección, el teléfono, el email o la
        web, el sello se retira hasta que se vuelvan a comprobar. El sello acredita únicamente estas
        comprobaciones; no es una valoración de la calidad asistencial del centro. Growwly puede
        retirarlo si detecta que algún dato deja de ser cierto.
      </p>
    </section>
  );
}
