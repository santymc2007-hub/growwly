"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

type ClinicFiltersProps = {
  ciudades: string[];
  tecnicas: string[];
  idiomas: string[];
};

const FIELDS = [
  { key: "ciudad", label: "Todas las ciudades" },
  { key: "tecnica", label: "Todos los tratamientos" },
  { key: "idioma", label: "Todos los idiomas" },
] as const;

const RATING_OPCIONES = [
  { value: "4", label: "4+ estrellas Google" },
  { value: "4.5", label: "4,5+ estrellas Google" },
] as const;

export function ClinicFilters({
  ciudades,
  tecnicas,
  idiomas,
}: ClinicFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const options: Record<(typeof FIELDS)[number]["key"], string[]> = {
    ciudad: ciudades,
    tecnica: tecnicas,
    idioma: idiomas,
  };

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  }

  function toggleBooleanFilter(key: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (params.get(key) === "1") {
      params.delete(key);
    } else {
      params.set(key, "1");
    }
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  }

  const verificadoActivo = searchParams.get("verificado") === "1";
  const financiacionActiva = searchParams.get("financiacion") === "1";

  const hasActiveFilters =
    FIELDS.some(({ key }) => searchParams.get(key)) ||
    Boolean(searchParams.get("ubicacion")) ||
    Boolean(searchParams.get("rating")) ||
    verificadoActivo ||
    financiacionActiva;

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative">
        <select
          value={searchParams.get("ubicacion") ?? ""}
          onChange={(e) => updateFilter("ubicacion", e.target.value)}
          aria-label="Ubicación"
          className="appearance-none rounded-full border border-line bg-white px-4 py-2 pr-9 text-sm text-ink shadow-sm transition hover:border-teal/40 focus:outline-none focus:ring-2 focus:ring-teal/30"
        >
          <option value="">Palma y pueblos</option>
          <option value="palma">Solo Palma</option>
          <option value="pueblo">Solo pueblos</option>
        </select>
        <span
          aria-hidden
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-soft"
        >
          ⌄
        </span>
      </div>

      {FIELDS.map(({ key, label }) => (
        <div key={key} className="relative">
          <select
            value={searchParams.get(key) ?? ""}
            onChange={(e) => updateFilter(key, e.target.value)}
            aria-label={label}
            className="appearance-none rounded-full border border-line bg-white px-4 py-2 pr-9 text-sm text-ink shadow-sm transition hover:border-teal/40 focus:outline-none focus:ring-2 focus:ring-teal/30"
          >
            <option value="">{label}</option>
            {options[key].map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
          <span
            aria-hidden
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-soft"
          >
            ⌄
          </span>
        </div>
      ))}

      <div className="relative">
        <select
          value={searchParams.get("rating") ?? ""}
          onChange={(e) => updateFilter("rating", e.target.value)}
          aria-label="Valoración mínima en Google"
          className="appearance-none rounded-full border border-line bg-white px-4 py-2 pr-9 text-sm text-ink shadow-sm transition hover:border-teal/40 focus:outline-none focus:ring-2 focus:ring-teal/30"
        >
          <option value="">Cualquier valoración</option>
          {RATING_OPCIONES.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
        <span
          aria-hidden
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-soft"
        >
          ⌄
        </span>
      </div>

      <button
        type="button"
        onClick={() => toggleBooleanFilter("verificado")}
        aria-pressed={verificadoActivo}
        className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
          verificadoActivo
            ? "border-sage-ink bg-sage text-sage-ink"
            : "border-line bg-white text-ink hover:border-teal/40"
        }`}
      >
        ✓ Verificada Growwly
      </button>

      <button
        type="button"
        onClick={() => toggleBooleanFilter("financiacion")}
        aria-pressed={financiacionActiva}
        className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
          financiacionActiva
            ? "border-cyan-dark bg-cyan text-white"
            : "border-line bg-white text-ink hover:border-teal/40"
        }`}
      >
        Con financiación
      </button>

      {hasActiveFilters && (
        <button
          type="button"
          onClick={() => router.push(pathname)}
          className="text-sm font-medium text-cyan hover:text-cyan-dark"
        >
          Quitar filtros
        </button>
      )}
    </div>
  );
}
