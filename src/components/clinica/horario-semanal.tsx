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
  "rounded-lg border border-line bg-white px-2 py-1.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-teal/30";

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

  return (
    <div className="flex flex-col gap-2">
      {/* Se manda como un único campo JSON — más simple de leer en el
          servidor que 21 campos sueltos */}
      <input type="hidden" name="horarios_estructurados" value={JSON.stringify(dias)} />

      {dias.map((d, i) => (
        <div
          key={d.dia}
          className="grid grid-cols-[90px_auto_1fr_auto_1fr] items-center gap-2 text-sm"
        >
          <span className="font-medium text-ink">{d.dia}</span>
          <label className="flex items-center gap-1.5 text-xs text-ink-soft">
            <input
              type="checkbox"
              checked={d.abierto}
              onChange={(e) => actualizar(i, { abierto: e.target.checked })}
            />
            Abierto
          </label>
          {d.abierto ? (
            <>
              <input
                type="time"
                value={d.desde}
                onChange={(e) => actualizar(i, { desde: e.target.value })}
                className={inputClass}
              />
              <span className="text-center text-ink-soft">a</span>
              <input
                type="time"
                value={d.hasta}
                onChange={(e) => actualizar(i, { hasta: e.target.value })}
                className={inputClass}
              />
            </>
          ) : (
            <span className="col-span-3 text-xs text-ink-soft">Cerrado</span>
          )}
        </div>
      ))}
    </div>
  );
}
