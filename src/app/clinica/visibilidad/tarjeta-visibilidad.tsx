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
      className={`relative flex flex-col rounded-[28px] bg-white p-6 shadow-[0_24px_60px_-24px_rgba(0,86,107,0.35)] transition sm:p-7 ${
        activo ? "ring-2 ring-teal/50" : "ring-1 ring-line"
      }`}
    >
      <div className="flex items-start gap-4">
        <span
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
            activo ? "bg-teal text-paper" : "bg-sage text-teal-dark"
          }`}
        >
          {icono}
        </span>
        <div>
          {campana && (
            <span className="inline-block rounded-full bg-yellow px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-teal-dark">
              {campana}
            </span>
          )}
          <p className="mt-2 font-display text-xl font-extrabold leading-tight text-teal-dark">
            {titulo}
          </p>
          <p className="mt-1 font-display text-2xl font-extrabold text-ink">
            {PRECIO_MENSUAL[tipo]} €
            <span className="font-sans text-sm font-medium text-ink-soft"> / mes + IVA</span>
          </p>
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">{descripcion}</p>
        </div>
      </div>

      {esquema && <div className="mt-5">{esquema}</div>}

      <p className="mt-4 rounded-2xl bg-paper-dim px-4 py-3 text-sm text-teal-dark">
        <span className="font-bold">Lo que ganas: </span>
        {beneficio}
      </p>

      {activo ? (
        <div className="mt-5">
          <span className="inline-block rounded-full bg-teal px-4 py-1.5 text-sm font-bold text-paper">
            Activo
          </span>
          <p className="mt-1.5 text-xs text-ink-soft">
            {expiraEn ? `Hasta ${formatearFecha(expiraEn)}` : "Indefinido"}
          </p>
        </div>
      ) : pendiente ? (
        <span className="mt-5 inline-block self-start rounded-full bg-orange/15 px-4 py-1.5 text-sm font-semibold text-[#8a5a00]">
          Pendiente de aprobación
        </span>
      ) : plazas && plazas.libres === 0 ? (
        <span className="mt-5 inline-block self-start rounded-full bg-paper-dim px-4 py-1.5 text-sm font-medium text-ink-soft">
          Completo · {plazas.total} de {plazas.total} plazas ocupadas
        </span>
      ) : (
        <div className="mt-5 flex flex-wrap items-center gap-4">
          <button
            type="button"
            disabled={pending}
            onClick={() => setEligiendoDuracion(true)}
            className="press rounded-full bg-yellow px-6 py-3 font-display text-base font-bold text-teal-dark shadow-lg shadow-yellow/30 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Solicitar
          </button>
          {plazas && (
            <span className="text-sm font-medium text-ink-soft">
              Quedan <strong className="text-teal-dark">{plazas.libres}</strong> de {plazas.total} plazas
            </span>
          )}
        </div>
      )}

      {eligiendoDuracion && (
        <div className="popover-anim absolute bottom-6 left-6 z-20 w-52 rounded-2xl bg-white p-2 shadow-[0_24px_60px_-24px_rgba(0,86,107,0.45)] ring-1 ring-line">
          <p className="mb-1.5 px-1 text-[11px] font-medium text-ink-soft">
            ¿Durante cuánto lo quieres?
          </p>
          {DURACIONES.map((d) => (
            <button
              key={d.etiqueta}
              type="button"
              onClick={() => elegirDuracion(d.meses)}
              className="block w-full rounded-xl px-3 py-2 text-left text-sm text-ink hover:bg-paper-dim"
            >
              {d.etiqueta}
              {d.meses && DESCUENTO_POR_MESES[d.meses] ? (
                <span className="ml-1.5 rounded-full bg-yellow px-1.5 text-[11px] font-bold text-teal-dark">
                  −{DESCUENTO_POR_MESES[d.meses]} %
                </span>
              ) : null}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setEligiendoDuracion(false)}
            className="mt-1 block w-full rounded-xl px-3 py-2 text-left text-xs text-ink-soft hover:bg-paper-dim"
          >
            Cancelar
          </button>
        </div>
      )}
    </div>
  );
}
