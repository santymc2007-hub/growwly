"use client";

import { toggleDestacado, moveClinic } from "./actions";

export function OrderControls({
  id,
  destacado,
  isFirst,
  isLast,
}: {
  id: string;
  destacado: boolean;
  isFirst: boolean;
  isLast: boolean;
}) {
  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={() => moveClinic(id, "up")}
        disabled={isFirst}
        aria-label="Subir posición"
        title="Subir"
        className="rounded px-1.5 py-0.5 text-ink-soft hover:bg-paper-dim hover:text-teal disabled:opacity-25 disabled:hover:bg-transparent"
      >
        ▲
      </button>
      <button
        type="button"
        onClick={() => moveClinic(id, "down")}
        disabled={isLast}
        aria-label="Bajar posición"
        title="Bajar"
        className="rounded px-1.5 py-0.5 text-ink-soft hover:bg-paper-dim hover:text-teal disabled:opacity-25 disabled:hover:bg-transparent"
      >
        ▼
      </button>
      <button
        type="button"
        onClick={() => toggleDestacado(id, !destacado)}
        aria-label={destacado ? "Quitar de destacadas" : "Marcar como destacada"}
        title={destacado ? "Destacada" : "Marcar como destacada"}
        className={`rounded px-1.5 py-0.5 text-base leading-none ${
          destacado ? "text-cyan" : "text-ink-soft hover:text-cyan"
        }`}
      >
        {destacado ? "★" : "☆"}
      </button>
    </div>
  );
}
