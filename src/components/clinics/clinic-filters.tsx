"use client";

import { useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type ClinicFiltersProps = {
  provincias: string[];
  tecnicas: string[];
  tipos: string[];
};

const FIELDS = [
  { key: "provincia", label: "Toda España" },
  { key: "tipo", label: "Tipos de centro" },
  { key: "tecnica", label: "Tratamiento" },
] as const;

const RATING_OPCIONES = [
  { value: "4", label: "4+ estrellas Google" },
  { value: "4.5", label: "4,5+ estrellas Google" },
] as const;

// Mismo estilo que "Acceso Centros"/"Mi cuenta" del header (ver
// site-header.tsx): pill bordeada en amarillo, rellena cuando está
// activa — en vez del toggle iOS anterior, para que los filtros se
// sientan parte de la misma familia visual del sitio.
function Switch({
  activo,
  onClick,
  children,
}: {
  activo: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={activo}
      onClick={onClick}
      className={`press rounded-full border-2 border-yellow px-4 py-2 text-sm font-semibold text-teal-dark transition ${
        activo ? "bg-yellow hover:opacity-90" : "hover:bg-yellow/10"
      }`}
    >
      {children}
    </button>
  );
}

export function ClinicFilters({ provincias, tecnicas, tipos }: ClinicFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [buscando, startTransition] = useTransition();

  const options: Record<(typeof FIELDS)[number]["key"], string[]> = {
    provincia: provincias,
    tipo: tipos,
    tecnica: tecnicas,
  };

  function navegar(query: string) {
    startTransition(() => {
      router.push(query ? `${pathname}?${query}` : pathname);
    });
  }

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    // El filtro de ciudad ya no tiene selector propio (se navega por
    // ciudad desde "Explora por ciudad"), pero un enlace externo podría
    // seguir trayendo ?ciudad= en la URL — se limpia igual al cambiar de
    // provincia para que no se quede un filtro de ciudad huérfano.
    if (key === "provincia") {
      params.delete("ciudad");
    }
    navegar(params.toString());
  }

  function toggleBooleanFilter(key: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (params.get(key) === "1") {
      params.delete(key);
    } else {
      params.set(key, "1");
    }
    navegar(params.toString());
  }

  const verificadoActivo = searchParams.get("verificado") === "1";
  const financiacionActiva = searchParams.get("financiacion") === "1";
  const ofertaActiva = searchParams.get("oferta") === "1";
  const primeraConsultaActiva = searchParams.get("primera_consulta") === "1";

  const hasActiveFilters =
    FIELDS.some(({ key }) => searchParams.get(key)) ||
    Boolean(searchParams.get("rating")) ||
    verificadoActivo ||
    financiacionActiva ||
    ofertaActiva ||
    primeraConsultaActiva;

  return (
    <div className="flex flex-col gap-3">
      {/* Fila 1: desplegables. Fila 2 (siempre debajo, nunca mezclada
          aquí aunque haya hueco de sobra): switches — así el bloque de
          filtros tiene una forma predecible en vez de reordenarse según
          el ancho disponible. */}
      <div className="flex flex-wrap items-center gap-3">
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
            <option value="">Valoración</option>
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
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Switch
          activo={verificadoActivo}
          onClick={() => toggleBooleanFilter("verificado")}
        >
          Sello verificado Growwly
        </Switch>

        <Switch
          activo={financiacionActiva}
          onClick={() => toggleBooleanFilter("financiacion")}
        >
          Financiación
        </Switch>

        <Switch activo={ofertaActiva} onClick={() => toggleBooleanFilter("oferta")}>
          Ofertas
        </Switch>

        <Switch
          activo={primeraConsultaActiva}
          onClick={() => toggleBooleanFilter("primera_consulta")}
        >
          1ª consulta gratuita
        </Switch>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={() => navegar("")}
            className="text-sm font-medium text-cyan hover:text-cyan-dark"
          >
            Quitar filtros
          </button>
        )}

        {buscando && (
          <span
            className="flex items-center gap-1.5 text-sm text-ink-soft"
            aria-live="polite"
          >
            <span
              className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-line border-t-teal"
              aria-hidden
            />
            Buscando…
          </span>
        )}
      </div>
    </div>
  );
}
