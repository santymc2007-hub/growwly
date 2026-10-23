import { CheckCircle2 } from "lucide-react";
import type { Clinic } from "@/lib/supabase/database.types";
import {
  CATEGORIAS_VENTAJA,
  etiquetaFinanciacion,
  etiquetaParking,
  etiquetaQuienOpera,
} from "@/lib/clinica/comparables";

type VentajaFicha = { nombre: string; categoria: string };

/** Los datos comparables que la clínica ha indicado, en frases cortas. */
function datosClave(clinic: Clinic): { etiqueta: string; valor: string }[] {
  const out: { etiqueta: string; valor: string }[] = [];
  const fin = etiquetaFinanciacion(clinic.financiacion_tipo);
  if (fin) out.push({ etiqueta: "Financiación", valor: fin });
  const parking = etiquetaParking(clinic.parking);
  if (parking) out.push({ etiqueta: "Parking", valor: parking });
  const opera = etiquetaQuienOpera(clinic.quien_opera);
  if (opera) out.push({ etiqueta: "Injerto", valor: opera });
  if (clinic.revisiones_num || clinic.seguimiento_meses) {
    const partes = [
      clinic.revisiones_num
        ? `${clinic.revisiones_num === 5 ? "5 o más" : clinic.revisiones_num} ${clinic.revisiones_num === 1 ? "revisión incluida" : "revisiones incluidas"}`
        : null,
      clinic.seguimiento_meses ? `seguimiento de ${clinic.seguimiento_meses} meses` : null,
    ].filter(Boolean);
    out.push({ etiqueta: "Revisiones", valor: partes.join(" · ") });
  }
  if (clinic.garantia !== null) {
    out.push({
      etiqueta: "Garantía de resultado",
      valor: clinic.garantia
        ? clinic.garantia_condiciones
          ? `Sí: ${clinic.garantia_condiciones}`
          : "Sí"
        : "No",
    });
  }
  if (clinic.max_uf_sesion)
    out.push({
      etiqueta: "Por sesión",
      valor: `Hasta ${clinic.max_uf_sesion.toLocaleString("es-ES")} unidades foliculares`,
    });
  if (clinic.anios_experiencia)
    out.push({ etiqueta: "Experiencia", valor: `${clinic.anios_experiencia} años` });
  if (clinic.injertos_anio)
    out.push({
      etiqueta: "Injertos al año",
      valor: `Unos ${clinic.injertos_anio.toLocaleString("es-ES")}`,
    });
  return out;
}

/**
 * Bloque "Lo que ofrece" de la ficha pública: datos clave (financiación,
 * parking, revisiones…) y valores añadidos marcados por la clínica.
 * Visible en todos los planes: es lo que compara el buscador con IA.
 */
export function LoQueOfrece({
  clinic,
  ventajas,
  className = "",
}: {
  clinic: Clinic;
  ventajas: VentajaFicha[];
  className?: string;
}) {
  const datos = datosClave(clinic);
  if (!datos.length && !ventajas.length) return null;

  return (
    <section className={className}>
      <h2 className="font-display text-lg text-teal-dark">Lo que ofrece {clinic.nombre}</h2>

      {datos.length > 0 && (
        <dl className="mt-3 grid gap-x-8 gap-y-2.5 sm:grid-cols-2">
          {datos.map((d) => (
            <div key={d.etiqueta} className="min-w-0">
              <dt className="text-xs font-semibold uppercase tracking-wide text-ink-soft/80">
                {d.etiqueta}
              </dt>
              <dd className="break-words text-sm font-medium text-ink">{d.valor}</dd>
            </div>
          ))}
        </dl>
      )}

      {CATEGORIAS_VENTAJA.map((cat) => {
        const deCat = ventajas.filter((v) => v.categoria === cat.valor);
        if (!deCat.length) return null;
        return (
          <div key={cat.valor} className="mt-4">
            <p className="text-sm font-semibold text-ink">{cat.etiqueta}</p>
            <ul className="mt-2 grid gap-x-8 gap-y-2 sm:grid-cols-2">
              {deCat.map((v) => (
                <li key={v.nombre} className="flex items-start gap-2 text-sm text-ink">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-teal" aria-hidden />
                  <span className="break-words">{v.nombre}</span>
                </li>
              ))}
            </ul>
          </div>
        );
      })}

      <p className="mt-3 text-xs text-ink-soft">Información indicada por la clínica.</p>
    </section>
  );
}
