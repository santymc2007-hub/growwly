"use client";

import { useState, useTransition, type ReactNode } from "react";
import { solicitarVisibilidad } from "./actions";
import {
  DESCUENTO_POR_MESES,
  PRECIO_MENSUAL,
  type Plazas,
  type TipoVisibilidad,
} from "@/lib/visibilidad/tipos";

const DURACIONES: { meses: number | null; etiqueta: string }[] = [
  { meses: 1, etiqueta: "1 mes" },
  { meses: 3, etiqueta: "3 meses" },
  { meses: 6, etiqueta: "6 meses" },
  { meses: 12, etiqueta: "12 meses" },
  { meses: null, etiqueta: "Indefinido" },
];

function formatearFecha(iso: string): string {
  return new Date(iso).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

type Props = {
  tipo: TipoVisibilidad;
  icono: ReactNode;
  titulo: string;
  descripcion: string;
  beneficio: string;
  activo: boolean;
  pendiente: boolean;
  expiraEn?: string | null;
  /** Solo destacados: plazas libres (si no queda ninguna, no se puede pedir). */
  plazas?: Plazas;
  /** Tipo de campaña (marca, resultado…). */
  campana?: string;
  /** Dibujo de dónde sale la clínica (ver esquema-visibilidad.tsx). */
  esquema?: ReactNode;
};

export function TarjetaVisibilidad({
  tipo,
  icono,
  titulo,
  descripcion,
  beneficio,
  activo,
  pendiente,
  expiraEn,
  plazas,
  campana,
  esquema,
}: Props) {
  const [pending, startTransition] = useTransition();
  const [eligiendoDuracion, setEligiendoDuracion] = useState(false);

  function elegirDuracion(meses: number | null) {
    setEligiendoDuracion(false);
    startTransition(() => {
      solicitarVisibilidad(tipo, meses);
    });
  }

  return (
    <div
      className={`relative flex flex-col rounded-2xl border p-5 transition ${
        activo ? "border-teal/40 bg-teal/[0.04]" : "border-line bg-white"
      }`}
    >
      <div className="flex items-start gap-3">
        <span
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
            activo ? "bg-teal text-paper" : "bg-sage/60 text-teal-dark"
          }`}
        >
          {icono}
        </span>
        <div>
          <p className="font-display text-base text-teal-dark">{titulo}</p>
          <p className="text-sm font-semibold text-ink">
            {PRECIO_MENSUAL[tipo]} €<span className="font-normal text-ink-soft"> / mes + IVA</span>
          </p>
          {campana && (
            <span className="mt-1.5 inline-block rounded-full bg-yellow/60 px-2 py-0.5 text-[11px] font-semibold text-teal-dark">
              {campana}
            </span>
          )}
          <p className="mt-1.5 text-sm text-ink-soft">{descripcion}</p>
        </div>
      </div>

      {esquema && <div className="mt-4">{esquema}</div>}

      <p className="mt-3 rounded-lg bg-sage/40 px-3 py-2 text-xs font-medium text-teal-dark">
        <span className="font-bold">Lo que ganas: </span>
        {beneficio}
      </p>

      {activo ? (
        <div className="mt-3">
          <span className="inline-block rounded-full bg-teal px-3 py-1 text-xs font-medium text-paper">
            Activo
          </span>
          <p className="mt-1.5 text-xs text-ink-soft">
            {expiraEn ? `Hasta ${formatearFecha(expiraEn)}` : "Indefinido"}
          </p>
        </div>
      ) : pendiente ? (
        <span className="mt-3 inline-block rounded-full bg-orange/15 px-3 py-1 text-xs font-medium text-orange">
          Pendiente de aprobación
        </span>
      ) : plazas && plazas.libres === 0 ? (
        <span className="mt-3 inline-block self-start rounded-full bg-paper-dim px-3 py-1 text-xs font-medium text-ink-soft">
          Completo · {plazas.total} de {plazas.total} plazas ocupadas
        </span>
      ) : (
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={pending}
            onClick={() => setEligiendoDuracion(true)}
            className="press rounded-full bg-gradient-to-r from-brand-green to-brand-blue px-4 py-2 text-sm font-bold text-teal-dark transition hover:opacity-90 disabled:opacity-60"
          >
            Solicitar
          </button>
          {plazas && (
            <span className="text-xs text-ink-soft">
              Quedan {plazas.libres} de {plazas.total} plazas
            </span>
          )}
        </div>
      )}

      {eligiendoDuracion && (
        <div className="popover-anim absolute left-5 top-full z-20 mt-1 w-44 rounded-xl border border-line bg-white p-2 shadow-lg">
          <p className="mb-1.5 px-1 text-[11px] font-medium text-ink-soft">
            ¿Durante cuánto lo quieres?
          </p>
          {DURACIONES.map((d) => (
            <button
              key={d.etiqueta}
              type="button"
              onClick={() => elegirDuracion(d.meses)}
              className="block w-full rounded-lg px-2 py-1.5 text-left text-sm text-ink hover:bg-sage/40"
            >
              {d.etiqueta}
              {d.meses && DESCUENTO_POR_MESES[d.meses] ? (
                <span className="ml-1 text-xs font-medium text-teal">
                  −{DESCUENTO_POR_MESES[d.meses]} %
                </span>
              ) : null}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setEligiendoDuracion(false)}
            className="mt-1 block w-full rounded-lg px-2 py-1.5 text-left text-xs text-ink-soft hover:bg-paper-dim"
          >
            Cancelar
          </button>
        </div>
      )}
    </div>
  );
}
