"use client";

export function FiltroCiudad({
  provinciaActual,
  ciudadActual,
  provincias,
  ciudades,
}: {
  provinciaActual: string;
  ciudadActual: string;
  provincias: string[];
  ciudades: string[];
}) {
  return (
    <form method="GET" className="flex items-center gap-2">
      <select
        name="provincia"
        defaultValue={provinciaActual}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        className="rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-teal/30"
      >
        <option value="">Toda España</option>
        {provincias.map((p) => (
          <option key={p} value={p}>
            {p}
          </option>
        ))}
      </select>
      <select
        name="ciudad"
        defaultValue={ciudadActual}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        className="rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-teal/30"
      >
        <option value="">Todas las ciudades</option>
        {ciudades.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
    </form>
  );
}
