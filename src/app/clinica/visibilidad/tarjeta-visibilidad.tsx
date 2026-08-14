"use client";

import { useState, useTransition } from "react";
import { solicitarVisibilidad, type TipoVisibilidad } from "./actions";

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
  icono: string;
  titulo: string;
  descripcion: string;
  activo: boolean;
  pendiente: boolean;
  expiraEn?: string | null;
};

export function TarjetaVisibilidad({
  tipo,
  icono,
  titulo,
  descripcion,
  activo,
  pendiente,
  expiraEn,
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
    <div className="relative rounded-2xl border border-line bg-white p-5">
      <p className="font-display text-base text-teal-dark">
        {icono} {titulo}
      </p>
      <p className="mt-1 text-sm text-ink-soft">{descripcion}</p>

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
      ) : (
        <button
          type="button"
          disabled={pending}
          onClick={() => setEligiendoDuracion(true)}
          className="press mt-3 rounded-full bg-gradient-to-r from-brand-green to-brand-blue px-4 py-2 text-sm font-bold text-teal-dark transition hover:opacity-90 disabled:opacity-60"
        >
          Solicitar
        </button>
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
