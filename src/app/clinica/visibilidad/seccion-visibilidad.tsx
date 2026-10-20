"use client";

import { useState, type ComponentProps } from "react";
import { TarjetaVisibilidad } from "./tarjeta-visibilidad";
import {
  descuentoAnual,
  type Periodo,
  type TipoVisibilidad,
} from "@/lib/visibilidad/tipos";

type DatosTarjeta = Omit<ComponentProps<typeof TarjetaVisibilidad>, "periodo" | "variante">;

const TIPOS: TipoVisibilidad[] = ["premium", "destacado", "destacado_provincia"];
const MAX_DESCUENTO = Math.max(...TIPOS.map(descuentoAnual));

function Selector({ periodo, onChange }: { periodo: Periodo; onChange: (p: Periodo) => void }) {
  const opcion = (valor: Periodo, texto: React.ReactNode) => (
    <button
      type="button"
      role="radio"
      aria-checked={periodo === valor}
      onClick={() => onChange(valor)}
      className={`flex items-center gap-2 rounded-full px-5 py-2 text-sm font-bold transition ${
        periodo === valor ? "bg-teal-dark text-white shadow-md" : "text-teal-dark hover:bg-sage/50"
      }`}
    >
      {texto}
    </button>
  );
  return (
    <div
      role="radiogroup"
      aria-label="Forma de pago"
      className="inline-flex rounded-full bg-white p-1 shadow-[0_8px_24px_-12px_rgba(0,86,107,0.35)] ring-1 ring-line"
    >
      {opcion("mensual", "Mensual")}
      {opcion(
        "anual",
        <>
          Anual
          <span
            className={`rounded-full px-2 py-0.5 text-[11px] font-extrabold ${
              periodo === "anual" ? "bg-mint text-teal-dark" : "bg-yellow text-teal-dark"
            }`}
          >
            −{MAX_DESCUENTO} %
          </span>
        </>,
      )}
    </div>
  );
}

function Grupo({ titulo }: { titulo: string }) {
  return <p className="mb-5 text-xs font-bold uppercase tracking-wide text-teal">{titulo}</p>;
}

/**
 * Las tres opciones de pago del panel, con el selector de forma de pago.
 * El Perfil ampliado va primero y aparte: genera confianza y convierte
 * visitas en pacientes. Los dos destacados, debajo: son visibilidad.
 */
export function SeccionVisibilidad({
  premium,
  destacados,
}: {
  premium: DatosTarjeta;
  destacados: DatosTarjeta[];
}) {
  const [periodo, setPeriodo] = useState<Periodo>("anual");

  return (
    <div>
      <div className="mb-10 flex flex-wrap items-center gap-x-4 gap-y-2">
        <Selector periodo={periodo} onChange={setPeriodo} />
        <p className="text-sm text-ink-soft">
          {periodo === "anual"
            ? `Pago anual: hasta un ${MAX_DESCUENTO} % menos que en mensual.`
            : "Mensual, sin permanencia: te das de baja cuando quieras."}
        </p>
      </div>

      <Grupo titulo="Confianza · convierte visitas en pacientes" />
      <TarjetaVisibilidad {...premium} periodo={periodo} variante="principal" />

      <div className="mt-12">
        <Grupo titulo="Visibilidad · que te vean más pacientes" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {destacados.map((d) => (
            <TarjetaVisibilidad key={d.tipo} {...d} periodo={periodo} />
          ))}
        </div>
      </div>

      <p className="mt-8 text-center text-xs text-ink-soft">
        Precios con IVA incluido. Plan mensual sin permanencia; plan anual de 12 meses.
      </p>
    </div>
  );
}
