"use client";

import { useTransition, type ReactNode } from "react";
import { Check } from "lucide-react";
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
  /** Dibujo de dónde se sale (ver esquema-visibilidad.tsx). */
  esquema?: ReactNode;
  /** Solo la tarjeta principal: lista de lo que mejora la ficha. */
  mejoras?: string[];
  /** «principal»: la tarjeta del Perfil ampliado, en oscuro y a lo ancho. */
  variante?: "normal" | "principal";
};

/**
 * Una opción de pago del panel. Arriba solo tipo de campaña, nombre y
 * precio; debajo el dibujo (destacados) o la lista de mejoras (Perfil
 * ampliado), y al final qué es, qué se gana y el botón.
 */
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
  mejoras,
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

  const cabecera = (
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
        <p
          className={`mt-2 font-display font-extrabold leading-tight ${textoFuerte} ${
            oscura ? "text-2xl" : "text-xl"
          }`}
        >
          {titulo}
        </p>

        <div className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-1">
          {anual && (
            <span
              className={`font-display text-lg font-bold line-through ${
                oscura ? "text-sage/70" : "text-ink-soft/70"
              }`}
            >
              {PRECIO_MENSUAL[tipo]} €
            </span>
          )}
          <span
            className={`font-display font-extrabold ${oscura ? "text-4xl text-white" : "text-3xl text-ink"}`}
          >
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
      </div>
    </div>
  );

  // Qué es y qué se gana, en un solo bloque.
  const queGanas = (
    <div
      className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
        oscura ? "bg-white/10 text-white" : "bg-paper-dim text-teal-dark"
      }`}
    >
      <p>{descripcion}</p>
      <p className="mt-1.5">
        <span className="font-bold">Lo que ganas: </span>
        {beneficio}
      </p>
    </div>
  );

  const accion = activo ? (
    <div>
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
    <span className="inline-block self-start rounded-full bg-orange/15 px-4 py-1.5 text-sm font-semibold text-[#8a5a00]">
      Pendiente de aprobación
    </span>
  ) : plazas && plazas.libres === 0 ? (
    <span className="inline-block self-start rounded-full bg-paper-dim px-4 py-1.5 text-sm font-medium text-ink-soft">
      Completo · {plazas.total} de {plazas.total} plazas ocupadas
    </span>
  ) : (
    <div className="flex flex-wrap items-center gap-4">
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
  );

  if (oscura) {
    // Escritorio: a la izquierda cabecera arriba y bloque + botón abajo;
    // a la derecha, la lista. En móvil: cabecera, lista, bloque, botón.
    return (
      <div className="relative rounded-[28px] bg-teal-dark p-6 shadow-[0_24px_60px_-20px_rgba(31,58,46,0.55)] sm:p-8">
        <span className="absolute -top-3.5 right-8 rounded-full bg-orange px-4 py-1.5 font-display text-xs font-extrabold uppercase tracking-wide text-teal-dark shadow-[0_6px_16px_-4px_rgba(255,186,31,0.6)]">
          Recomendado
        </span>
        <div className="grid grid-cols-1 gap-x-10 gap-y-6 lg:grid-cols-2">
          <div className="min-w-0">{cabecera}</div>
          {mejoras && mejoras.length > 0 && (
            <div className="min-w-0 rounded-2xl bg-white/5 p-5 ring-1 ring-white/10 lg:row-span-2">
              <p className="text-xs font-bold uppercase tracking-wide text-mint">
                Lo que suma a tu ficha
              </p>
              <ul className="mt-3 grid gap-2.5">
                {mejoras.map((m) => (
                  <li key={m} className="flex items-start gap-2.5 text-sm leading-snug text-white">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-mint/20">
                      <Check size={12} strokeWidth={3} className="text-mint" aria-hidden />
                    </span>
                    {m}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="flex min-w-0 flex-col gap-5 lg:justify-end">
            {queGanas}
            {accion}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col gap-5 rounded-[28px] bg-white p-6 shadow-[0_24px_60px_-24px_rgba(0,86,107,0.35)] transition sm:p-8 ${
        activo ? "ring-2 ring-teal/50" : "ring-1 ring-line"
      }`}
    >
      {cabecera}
      {esquema}
      {queGanas}
      <div className="mt-auto">{accion}</div>
    </div>
  );
}
