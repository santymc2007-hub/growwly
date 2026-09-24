import Image from "next/image";
import { ConfirmButton } from "@/components/confirm-button";
import { elegirClinica } from "@/app/cuenta/solicitud/actions";
import {
  TIPO_PRECIO_LABEL,
  TIPO_CONSULTA_LABEL,
  etiquetaIncluye,
  formatearPrecioPropuesta,
} from "@/lib/leads/propuesta-options";
import type { Database } from "@/lib/supabase/database.types";

type Propuesta = Database["public"]["Tables"]["propuestas_clinica"]["Row"];

/**
 * Tarjeta de una propuesta recibida, tal y como la ve el paciente —
 * sin ningún dato de la clínica que no sea su nombre/logo. Elegir
 * libera el contacto del paciente solo a esta clínica y descarta al
 * resto para la misma solicitud (Fase 5).
 */
export function PropuestaRecibidaCard({
  solicitudId,
  leadId,
  nombreClinica,
  logoUrl,
  propuesta,
}: {
  solicitudId: string;
  leadId: string;
  nombreClinica: string;
  logoUrl: string | null;
  propuesta: Propuesta;
}) {
  return (
    <div className="rounded-xl border border-line bg-white p-5">
      <div className="flex items-center gap-3">
        {logoUrl ? (
          <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-sage">
            <Image src={logoUrl} alt="" fill sizes="40px" className="object-cover" />
          </span>
        ) : (
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sage text-sm font-bold text-sage-ink">
            {nombreClinica.charAt(0).toUpperCase()}
          </span>
        )}
        <p className="font-display text-lg text-teal-dark">{nombreClinica}</p>
      </div>

      <dl className="mt-4 divide-y divide-line text-sm">
        {propuesta.tratamiento && <Row label="Tratamiento" value={propuesta.tratamiento} />}
        <Row label="Precio" value={formatearPrecioPropuesta(propuesta)} />
        <Row
          label="Tipo de precio"
          value={TIPO_PRECIO_LABEL[propuesta.tipo_precio] ?? propuesta.tipo_precio}
        />
        {propuesta.tipo_consulta && (
          <Row
            label="Primera cita"
            value={TIPO_CONSULTA_LABEL[propuesta.tipo_consulta] ?? propuesta.tipo_consulta}
          />
        )}
        {propuesta.disponibilidad && (
          <Row label="Disponibilidad" value={propuesta.disponibilidad} />
        )}
        {propuesta.incluye.length > 0 && (
          <Row label="Incluye" value={propuesta.incluye.map(etiquetaIncluye).join(", ")} />
        )}
      </dl>

      {propuesta.mensaje && (
        <p className="mt-3 rounded-lg bg-paper-dim/60 p-3 text-sm text-ink">
          {propuesta.mensaje}
        </p>
      )}

      <p className="mt-4 text-xs text-ink-soft">
        Presupuesto orientativo — el definitivo requiere valorar tu caso en
        persona.
      </p>

      <div className="mt-3">
        <ConfirmButton
          action={elegirClinica.bind(null, solicitudId, leadId)}
          triggerLabel="Elegir esta clínica"
          title={`¿Elegir a ${nombreClinica}?`}
          message="Le compartiremos tu nombre, teléfono y email para que pueda contactarte, y el resto de clínicas quedarán descartadas para esta solicitud. Esta acción no se puede deshacer."
          confirmLabel="Sí, elegir esta clínica"
          triggerClassName="inline-block rounded-full bg-teal px-5 py-2 text-sm font-medium text-paper transition hover:bg-teal-dark"
        />
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 py-2">
      <dt className="text-ink-soft">{label}</dt>
      <dd className="text-right font-medium text-ink">{value}</dd>
    </div>
  );
}
