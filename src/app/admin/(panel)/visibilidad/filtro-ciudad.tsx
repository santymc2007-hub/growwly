"use client";

import { MUNICIPIOS_MALLORCA } from "@/lib/clinic-options";

export function FiltroCiudad({ ciudadActual }: { ciudadActual: string }) {
  return (
    <form method="GET" className="flex items-center gap-2">
      <select
        name="ciudad"
        defaultValue={ciudadActual}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        className="rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-teal/30"
      >
        <option value="">Todas las ciudades</option>
        {MUNICIPIOS_MALLORCA.map((m) => (
          <option key={m} value={m}>
            {m}
          </option>
        ))}
      </select>
    </form>
  );
}
