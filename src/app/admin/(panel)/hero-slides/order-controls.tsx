"use client";

import { moveSlide, toggleActivo } from "./actions";

export function OrderControls({
  id,
  activo,
  isFirst,
  isLast,
}: {
  id: string;
  activo: boolean;
  isFirst: boolean;
  isLast: boolean;
}) {
  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={() => moveSlide(id, "up")}
        disabled={isFirst}
        aria-label="Subir posición"
        title="Subir"
        className="rounded px-1.5 py-0.5 text-ink-soft hover:bg-paper-dim hover:text-teal disabled:opacity-25 disabled:hover:bg-transparent"
      >
        ▲
      </button>
      <button
        type="button"
        onClick={() => moveSlide(id, "down")}
        disabled={isLast}
        aria-label="Bajar posición"
        title="Bajar"
        className="rounded px-1.5 py-0.5 text-ink-soft hover:bg-paper-dim hover:text-teal disabled:opacity-25 disabled:hover:bg-transparent"
      >
        ▼
      </button>
      <button
        type="button"
        onClick={() => toggleActivo(id, !activo)}
        aria-label={activo ? "Desactivar slide" : "Activar slide"}
        title={activo ? "Activa (visible en la home)" : "Inactiva"}
        className={`ml-2 rounded-full px-2.5 py-1 text-xs font-medium ${
          activo
            ? "bg-sage text-sage-ink"
            : "bg-paper-dim text-ink-soft hover:text-teal"
        }`}
      >
        {activo ? "Activa" : "Inactiva"}
      </button>
    </div>
  );
}
