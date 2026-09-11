"use client";

import { useState } from "react";

// Rango recomendado para que Google no corte la meta description en
// los resultados de búsqueda (varía algo según el dispositivo, pero
// 120-160 caracteres es el consenso habitual de SEO).
const LARGO_MIN_IDEAL = 120;
const LARGO_MAX_IDEAL = 160;

type Props = {
  id: string;
  name: string;
  label: string;
  defaultValue?: string | null;
  rows?: number;
};

export function CampoMetaDescripcion({
  id,
  name,
  label,
  defaultValue,
  rows = 3,
}: Props) {
  const [longitud, setLongitud] = useState(defaultValue?.length ?? 0);
  const restantes = LARGO_MAX_IDEAL - longitud;
  const enRango = longitud >= LARGO_MIN_IDEAL && longitud <= LARGO_MAX_IDEAL;

  let colorContador = "text-ink-soft";
  if (longitud > LARGO_MAX_IDEAL) colorContador = "text-error";
  else if (enRango) colorContador = "text-green";

  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <label className="text-sm font-medium text-ink" htmlFor={id}>
          {label}
        </label>
        <span className={`shrink-0 text-xs font-medium ${colorContador}`}>
          {restantes >= 0
            ? `${restantes} restantes`
            : `${Math.abs(restantes)} de más`}
        </span>
      </div>
      <textarea
        id={id}
        name={name}
        rows={rows}
        defaultValue={defaultValue ?? undefined}
        onChange={(e) => setLongitud(e.target.value.length)}
        className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-teal/30"
      />
      <p className="mt-1 text-xs text-ink-soft">
        Ideal entre {LARGO_MIN_IDEAL} y {LARGO_MAX_IDEAL} caracteres — fuera
        de ese rango, Google puede cortarla o desaprovecharla.
      </p>
    </div>
  );
}
