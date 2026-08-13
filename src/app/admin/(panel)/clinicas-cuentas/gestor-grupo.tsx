"use client";

import { useState } from "react";
import { anadirClinicaAlGrupo, quitarClinicaDelGrupo } from "./actions";

type ClinicaVinculada = { id: string; nombre: string };
type ClinicaOpcion = { id: string; nombre: string };

export function GestorGrupo({
  profileId,
  vinculadas,
  todasLasClinicas,
}: {
  profileId: string;
  vinculadas: ClinicaVinculada[];
  todasLasClinicas: ClinicaOpcion[];
}) {
  const [abierto, setAbierto] = useState(false);
  const idsVinculados = new Set(vinculadas.map((c) => c.id));
  const disponibles = todasLasClinicas.filter((c) => !idsVinculados.has(c.id));

  const anadir = anadirClinicaAlGrupo.bind(null, profileId);
  const quitar = (clinicId: string) => quitarClinicaDelGrupo.bind(null, profileId, clinicId);

  return (
    <div>
      <div className="flex flex-wrap gap-1.5">
        {vinculadas.map((c) => (
          <form key={c.id} action={quitar(c.id)}>
            <button
              type="submit"
              title="Quitar del grupo"
              className="group flex items-center gap-1 rounded-full bg-sage px-2.5 py-1 text-xs font-medium text-sage-ink hover:bg-error/10 hover:text-error"
            >
              {c.nombre}
              <span aria-hidden className="opacity-50 group-hover:opacity-100">
                ✕
              </span>
            </button>
          </form>
        ))}
      </div>

      {abierto ? (
        <form action={anadir} className="mt-2 flex items-center gap-1.5">
          <select
            name="clinicId"
            defaultValue=""
            className="rounded-lg border border-line bg-white px-2 py-1 text-xs text-ink focus:outline-none focus:ring-2 focus:ring-teal/30"
          >
            <option value="" disabled>
              Elige una clínica…
            </option>
            {disponibles.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="rounded-lg bg-teal px-2.5 py-1 text-xs font-medium text-paper hover:bg-teal-dark"
          >
            Añadir
          </button>
          <button
            type="button"
            onClick={() => setAbierto(false)}
            className="text-xs text-ink-soft hover:text-ink"
          >
            Cancelar
          </button>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setAbierto(true)}
          className="mt-1.5 text-xs font-medium text-cyan hover:text-cyan-dark"
        >
          + Añadir clínica al grupo
        </button>
      )}
    </div>
  );
}
