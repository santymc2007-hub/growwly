"use client";

import { nombreVisibleTecnica } from "@/lib/tecnicas-visibles";

import { useEffect, useTransition, type ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type ClinicFiltersProps = {
  /** Título del bloque ("29 centros encontrados"): en escritorio ancho va
   *  en la columna izquierda, encima de los desplegables. */
  cabecera?: ReactNode;
  provincias: string[];
  tecnicas: string[];
  tipos: string[];
};

const FIELDS = [
  { key: "provincia", label: "Toda España" },
  { key: "tipo", label: "Tipos de centro" },
  { key: "tecnica", label: "Tratamiento" },
] as const;

// En móvil los desplegables van en rejilla de 2 columnas y ocupan su
// celda (w-full + truncate): un <select> nativo mide lo que su opción
// más larga, y sin esto se salía de la tarjeta.
const SELECT_CLASS =
  "w-full min-w-0 truncate appearance-none rounded-full border border-line bg-white px-3 py-1.5 pr-7 text-xs text-ink sm:px-4 sm:py-2 sm:pr-9 sm:text-sm shadow-sm transition hover:border-teal/40 focus:outline-none focus:ring-2 focus:ring-teal/30 sm:w-auto xl:w-full";

const RATING_OPCIONES = [
  { value: "4", label: "4+ estrellas Google" },
  { value: "4.5", label: "4,5+ estrellas Google" },
] as const;

// Pill bordeada en amarillo (misma familia que "Acceso Centros" del
// header) con un mini interruptor dentro: sin él no se entendía que
// eran filtros on/off. Activo → pill rellena + interruptor a la derecha.
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
      className={`press flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full xl:w-full border-2 border-yellow py-1 pl-1.5 pr-3 text-xs font-semibold text-teal-dark transition sm:gap-2 sm:py-1.5 sm:pl-2 sm:pr-4 sm:text-sm ${
        activo ? "bg-yellow hover:opacity-90" : "hover:bg-yellow/10"
      }`}
    >
      <span
        aria-hidden
        className={`relative inline-block h-4 w-7 shrink-0 rounded-full transition-colors ${
          activo ? "bg-teal-dark" : "bg-line"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 h-3 w-3 rounded-full bg-white shadow-sm transition-transform duration-200 ${
            activo ? "translate-x-3" : "translate-x-0"
          }`}
        />
      </span>
      {children}
    </button>
  );
}

export function ClinicFilters({ cabecera, provincias, tecnicas, tipos }: ClinicFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [buscando, startTransition] = useTransition();

  // Mientras carga el nuevo resultado, el listado se atenúa (ver
  // [data-resultados] en globals.css): así se nota que el filtro actúa
  // aunque el orden de arriba no cambie.
  useEffect(() => {
    const raiz = document.documentElement;
    if (buscando) raiz.dataset.buscando = "1";
    else delete raiz.dataset.buscando;
    return () => {
      delete raiz.dataset.buscando;
    };
  }, [buscando]);

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

  // "Quitar filtros" y "Buscando…": en móvil/tablet van al final de la
  // fila de switches; en escritorio ancho, junto al título (la rejilla
  // 2×2 de switches de la derecha queda solo para los 4 filtros).
  const acciones = (
    <>
      {hasActiveFilters && (
        <button
          type="button"
          onClick={() => navegar("")}
          className="shrink-0 whitespace-nowrap text-xs font-medium text-cyan sm:text-sm hover:text-cyan-dark"
        >
          Quitar filtros
        </button>
      )}

      {buscando && (
        <span
          className="flex shrink-0 items-center gap-1.5 whitespace-nowrap text-sm text-ink-soft"
          aria-live="polite"
        >
          <span
            className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-line border-t-teal"
            aria-hidden
          />
          Buscando…
        </span>
      )}
    </>
  );

  return (
    // xl: dos columnas — título + desplegables a la izquierda y los 4
    // switches en rejilla 2×2 a la derecha. Por debajo, como siempre:
    // desplegables arriba y switches en una fila debajo.
    <div className="flex flex-col gap-2 sm:gap-3 xl:flex-row xl:items-center xl:gap-6">
      <div className="flex min-w-0 flex-1 flex-col gap-2 sm:gap-3">
      {cabecera || hasActiveFilters || buscando ? (
        <div className="flex items-center gap-4">
          {cabecera}
          <div className="hidden items-center gap-3 xl:flex">{acciones}</div>
        </div>
      ) : null}
      {/* Desplegables. Hasta xl los switches van siempre en una fila
          debajo (nunca mezclados aquí aunque haya hueco), para que el
          bloque tenga una forma predecible; en xl, rejilla 2×2 a la
          derecha. */}
      <div className="grid grid-cols-2 gap-1.5 sm:flex sm:flex-wrap sm:items-center sm:gap-3 xl:grid xl:grid-cols-4 xl:gap-2.5">
        {FIELDS.map(({ key, label }) => (
          <div key={key} className="relative min-w-0">
            <select
              value={searchParams.get(key) ?? ""}
              onChange={(e) => updateFilter(key, e.target.value)}
              aria-label={label}
              className={SELECT_CLASS}
            >
              <option value="">{label}</option>
              {options[key].map((value) => (
                <option key={value} value={value}>
                  {key === "tecnica" ? nombreVisibleTecnica(value) : value}
                </option>
              ))}
            </select>
            <span
              aria-hidden
              className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-ink-soft sm:right-3 sm:text-sm"
            >
              ⌄
            </span>
          </div>
        ))}

        <div className="relative min-w-0">
          <select
            value={searchParams.get("rating") ?? ""}
            onChange={(e) => updateFilter("rating", e.target.value)}
            aria-label="Valoración mínima en Google"
            className={SELECT_CLASS}
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
            className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-ink-soft sm:right-3 sm:text-sm"
          >
            ⌄
          </span>
        </div>
      </div>

      </div>

      {/* En móvil, los switches van en una fila con scroll horizontal
          (sin barra visible) en vez de apilarse en 3-4 líneas. */}
      <div className="-mx-3 flex items-center gap-1.5 overflow-x-auto px-3 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:flex-wrap sm:gap-3 sm:overflow-visible sm:px-0 sm:pb-0 xl:grid xl:shrink-0 xl:grid-cols-2 xl:gap-2">
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

        <div className="contents xl:hidden">{acciones}</div>
      </div>
    </div>
  );
}
