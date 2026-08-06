"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

type ClinicFiltersProps = {
  ciudades: string[];
  tecnicas: string[];
  idiomas: string[];
};

const FIELDS = [
  { key: "ciudad", label: "Todas las ciudades" },
  { key: "tecnica", label: "Todas las técnicas" },
  { key: "idioma", label: "Todos los idiomas" },
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

  const hasActiveFilters =
    FIELDS.some(({ key }) => searchParams.get(key)) ||
    Boolean(searchParams.get("ubicacion"));

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
