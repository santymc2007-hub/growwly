"use client";

import { useState } from "react";

type DiaHorario = {
  dia: string;
  abierto: boolean;
  desde: string;
  hasta: string;
};

const DIAS = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
  "Domingo",
];

function horarioPorDefecto(existente: DiaHorario[]): DiaHorario[] {
  return DIAS.map((dia) => {
    const encontrado = existente.find((d) => d.dia === dia);
    return (
      encontrado ?? {
        dia,
        abierto: !["Sábado", "Domingo"].includes(dia),
        desde: "09:00",
        hasta: "20:00",
      }
    );
  });
}

const inputClass =
  "w-full min-w-0 rounded-lg border border-line bg-white px-2 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-teal/30";

export function HorarioSemanal({
  valorInicial,
}: {
  valorInicial: unknown;
}) {
  const inicial = Array.isArray(valorInicial)
    ? (valorInicial as DiaHorario[])
    : [];
  const [dias, setDias] = useState<DiaHorario[]>(horarioPorDefecto(inicial));

  function actualizar(index: number, cambios: Partial<DiaHorario>) {
    setDias((prev) =>
      prev.map((d, i) => (i === index ? { ...d, ...cambios } : d)),
    );
  }

  // Copia el horario del primer día abierto al resto de días abiertos —
  // lo normal es tener el mismo horario toda la semana.
  const primerAbierto = dias.find((d) => d.abierto);
  function copiarATodos() {
    if (!primerAbierto) return;
    setDias((prev) =>
      prev.map((d) =>
        d.abierto ? { ...d, desde: primerAbierto.desde, hasta: primerAbierto.hasta } : d,
      ),
    );
  }

  return (
    <div>
      {/* Se manda como un único campo JSON — más simple de leer en el
          servidor que 21 campos sueltos */}
      <input type="hidden" name="horarios_estructurados" value={JSON.stringify(dias)} />

      <div className="divide-y divide-line">
        {dias.map((d, i) => (
          // Móvil: día + interruptor arriba y las horas debajo.
          // Desde sm: todo en una fila.
          <div
            key={d.dia}
            className="flex flex-col gap-2 py-2.5 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:gap-4"
          >
            <div className="flex items-center justify-between gap-3 sm:w-48 sm:shrink-0">
              <span className="text-sm font-medium text-ink">{d.dia}</span>
              <label className="flex cursor-pointer items-center gap-2 text-xs text-ink-soft">
                <span className="w-12 text-right">{d.abierto ? "Abierto" : "Cerrado"}</span>
                <input
                  type="checkbox"
                  role="switch"
                  checked={d.abierto}
                  onChange={(e) => actualizar(i, { abierto: e.target.checked })}
                  aria-label={`${d.dia}: abierto`}
                  className="peer sr-only"
                />
                <span
                  aria-hidden
                  className="relative h-5 w-9 shrink-0 rounded-full bg-line transition-colors peer-checked:bg-teal peer-focus-visible:ring-2 peer-focus-visible:ring-teal/40 after:absolute after:left-0.5 after:top-0.5 after:h-4 after:w-4 after:rounded-full after:bg-white after:shadow after:transition-transform peer-checked:after:translate-x-4"
                />
              </label>
            </div>
            {d.abierto && (
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <input
                  type="time"
                  value={d.desde}
                  onChange={(e) => actualizar(i, { desde: e.target.value })}
                  aria-label={`${d.dia}: desde`}
                  className={inputClass}
                />
                <span className="shrink-0 text-sm text-ink-soft">a</span>
                <input
                  type="time"
                  value={d.hasta}
                  onChange={(e) => actualizar(i, { hasta: e.target.value })}
                  aria-label={`${d.dia}: hasta`}
                  className={inputClass}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {primerAbierto && (
        <button
          type="button"
          onClick={copiarATodos}
          className="press mt-3 text-left text-xs font-medium text-cyan-dark hover:underline"
        >
          Copiar el horario del {primerAbierto.dia.toLowerCase()} a todos los días abiertos
        </button>
      )}
    </div>
  );
}
