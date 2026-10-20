"use client";

import { useTransition, type ReactNode } from "react";
import { solicitarVisibilidad } from "./actions";
import {
  PRECIO_ANUAL_MES,
  PRECIO_MENSUAL,
  ahorroAnual,
  descuentoAnual,
  type Periodo,
  type Plazas,
  type TipoVisibilidad,
} from "@/lib/visibilidad/tipos";

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
  /** Mensual (sin permanencia) o anual (12 meses, precio rebajado). */
  periodo: Periodo;
  /** Solo destacados: plazas libres (si no queda ninguna, no se puede pedir). */
  plazas?: Plazas;
  /** Tipo de campaña (marca, resultado…). */
  campana?: string;
  /** Dibujo de lo que se consigue (ver esquema-visibilidad.tsx). */
  esquema?: ReactNode;
  /** «principal»: la tarjeta del Perfil ampliado, en oscuro y a lo ancho. */
  variante?: "normal" | "principal";
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
  periodo,
  plazas,
  campana,
  esquema,
  variante = "normal",
}: Props) {
  const [pending, startTransition] = useTransition();
  const oscura = variante === "principal";
  const anual = periodo === "anual";
  const precio = anual ? PRECIO_ANUAL_MES[tipo] : PRECIO_MENSUAL[tipo];

  function solicitar() {
    // Anual = 12 meses; mensual = se renueva cada mes hasta que se dé de baja.
    startTransition(() => {
      solicitarVisibilidad(tipo, anual ? 12 : null);
    });
  }

  const textoSuave = oscura ? "text-sage" : "text-ink-soft";
  const textoFuerte = oscura ? "text-white" : "text-teal-dark";

  return (
    <div
      className={`relative flex flex-col rounded-[28px] p-6 transition sm:p-8 ${
        oscura
          ? "bg-teal-dark shadow-[0_24px_60px_-20px_rgba(31,58,46,0.55)]"
          : `bg-white shadow-[0_24px_60px_-24px_rgba(0,86,107,0.35)] ${
              activo ? "ring-2 ring-teal/50" : "ring-1 ring-line"
            }`
      }`}
    >
      {oscura && (
        <span className="absolute -top-3.5 right-8 rounded-full bg-orange px-4 py-1.5 font-display text-xs font-extrabold uppercase tracking-wide text-teal-dark shadow-[0_6px_16px_-4px_rgba(255,186,31,0.6)]">
          Recomendado
        </span>
      )}

      <div
        className={
          oscura
            ? "grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-center"
            : ""
        }
      >
        <div className="min-w-0">
          <div className="flex items-start gap-4">
            <span
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
                oscura ? "bg-white/10 text-mint" : activo ? "bg-teal text-paper" : "bg-sage text-teal-dark"
              }`}
            >
              {icono}
            </span>
            <div className="min-w-0">
              {campana && (
                <span className="inline-block rounded-full bg-yellow px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-teal-dark">
                  {campana}
                </span>
              )}
              <p className={`mt-2 font-display font-extrabold leading-tight ${textoFuerte} ${oscura ? "text-2xl" : "text-xl"}`}>
                {titulo}
              </p>

              <div className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-1">
                {anual && (
                  <span className={`font-display text-lg font-bold line-through ${oscura ? "text-sage/70" : "text-ink-soft/70"}`}>
                    {PRECIO_MENSUAL[tipo]} €
                  </span>
                )}
                <span className={`font-display font-extrabold ${oscura ? "text-4xl text-white" : "text-3xl text-ink"}`}>
                  {precio} €
                </span>
                <span className={`text-sm font-medium ${textoSuave}`}>/ mes</span>
              </div>
              {anual ? (
                <p className="mt-1.5 flex flex-wrap items-center gap-2 text-xs">
                  <span className="rounded-full bg-mint px-2 py-0.5 font-bold text-teal-dark">
                    −{descuentoAnual(tipo)} %
                  </span>
                  <span className={textoSuave}>
                    Ahorras {ahorroAnual(tipo)} € al año · {precio * 12} € / año
                  </span>
                </p>
              ) : (
                <p className={`mt-1.5 text-xs ${textoSuave}`}>
                  Sin permanencia. En pago anual, {PRECIO_ANUAL_MES[tipo]} €/mes (−{descuentoAnual(tipo)} %).
                </p>
              )}

              <p className={`mt-3 text-sm leading-relaxed ${textoSuave}`}>{descripcion}</p>
            </div>
          </div>

          {!oscura && esquema && <div className="mt-5">{esquema}</div>}

          <p
            className={`mt-4 rounded-2xl px-4 py-3 text-sm ${
              oscura ? "bg-white/10 text-white" : "bg-paper-dim text-teal-dark"
            }`}
          >
            <span className="font-bold">Lo que ganas: </span>
            {beneficio}
          </p>

          {activo ? (
            <div className="mt-5">
              <span
                className={`inline-block rounded-full px-4 py-1.5 text-sm font-bold ${
                  oscura ? "bg-mint text-teal-dark" : "bg-teal text-paper"
                }`}
              >
                Activo
              </span>
              <p className={`mt-1.5 text-xs ${textoSuave}`}>
                {expiraEn ? `Hasta ${formatearFecha(expiraEn)}` : "Se renueva cada mes"}
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
                onClick={solicitar}
                className="press rounded-full bg-yellow px-6 py-3 font-display text-base font-bold text-teal-dark shadow-lg shadow-yellow/30 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {pending ? "Enviando…" : anual ? "Solicitar plan anual" : "Solicitar plan mensual"}
              </button>
              {plazas && (
                <span className={`text-sm font-medium ${textoSuave}`}>
                  Quedan <strong className={textoFuerte}>{plazas.libres}</strong> de {plazas.total} plazas
                </span>
              )}
            </div>
          )}
        </div>

        {oscura && esquema && <div className="min-w-0">{esquema}</div>}
      </div>
    </div>
  );
}
