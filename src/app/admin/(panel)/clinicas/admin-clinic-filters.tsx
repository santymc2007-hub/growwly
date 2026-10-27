"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";

type ProvinciaFiltro = { provincia: string; ciudades: { nombre: string; n: number }[] };

type Props = {
  provincias: ProvinciaFiltro[];
};

export function AdminClinicFilters({ provincias }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const [q, setQ] = useState(searchParams.get("q") ?? "");

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    startTransition(() => {
      const query = params.toString();
      router.push(query ? `${pathname}?${query}` : pathname);
    });
  }

  const hasActiveFilters =
    Boolean(searchParams.get("q")) ||
    Boolean(searchParams.get("ciudad")) ||
    Boolean(searchParams.get("estado")) ||
    Boolean(searchParams.get("publicado"));

  return (
    <div className="mt-4 flex flex-wrap items-center gap-3">
      <input
        type="search"
        placeholder="Buscar por nombre…"
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          updateParam("q", e.target.value);
        }}
        className="rounded-full border border-line bg-white px-4 py-2 text-sm text-ink shadow-sm focus:outline-none focus:ring-2 focus:ring-teal/30"
      />

      <FiltroCiudades
        provincias={provincias}
        elegidas={(searchParams.get("ciudad") ?? "").split("|").filter(Boolean)}
        onCambio={(lista) => updateParam("ciudad", lista.join("|"))}
      />

      <select
        value={searchParams.get("estado") ?? ""}
        onChange={(e) => updateParam("estado", e.target.value)}
        className="rounded-full border border-line bg-white px-4 py-2 text-sm text-ink shadow-sm focus:outline-none focus:ring-2 focus:ring-teal/30"
      >
        <option value="">Verificada o no</option>
        <option value="verificada">Solo verificadas</option>
        <option value="pendiente">Solo pendientes</option>
      </select>

      <select
        value={searchParams.get("publicado") ?? ""}
        onChange={(e) => updateParam("publicado", e.target.value)}
        className="rounded-full border border-line bg-white px-4 py-2 text-sm text-ink shadow-sm focus:outline-none focus:ring-2 focus:ring-teal/30"
      >
        <option value="">Publicada o de baja</option>
        <option value="si">Solo publicadas</option>
        <option value="no">Solo de baja</option>
      </select>

      {hasActiveFilters && (
        <button
          type="button"
          onClick={() => {
            setQ("");
            router.push(pathname);
          }}
          className="text-sm font-medium text-cyan hover:text-cyan-dark"
        >
          Quitar filtros
        </button>
      )}
    </div>
  );
}

/**
 * Filtro de ciudades: un desplegable con acordeón por provincia. Se
 * pueden marcar varias ciudades, o una provincia entera de golpe.
 */
function FiltroCiudades({
  provincias,
  elegidas,
  onCambio,
}: {
  provincias: ProvinciaFiltro[];
  elegidas: string[];
  onCambio: (lista: string[]) => void;
}) {
  const [abierto, setAbierto] = useState(false);
  const [abiertas, setAbiertas] = useState<Set<string>>(new Set());
  const caja = useRef<HTMLDivElement>(null);
  const sel = new Set(elegidas);

  // Se cierra al hacer clic fuera.
  useEffect(() => {
    if (!abierto) return;
    const fuera = (e: MouseEvent) => {
      if (caja.current && !caja.current.contains(e.target as Node)) setAbierto(false);
    };
    document.addEventListener("mousedown", fuera);
    return () => document.removeEventListener("mousedown", fuera);
  }, [abierto]);

  function alternarCiudad(nombre: string) {
    const n = new Set(sel);
    if (n.has(nombre)) n.delete(nombre);
    else n.add(nombre);
    onCambio(Array.from(n));
  }

  function alternarProvincia(p: ProvinciaFiltro) {
    const todas = p.ciudades.every((c) => sel.has(c.nombre));
    const n = new Set(sel);
    for (const c of p.ciudades) {
      if (todas) n.delete(c.nombre);
      else n.add(c.nombre);
    }
    onCambio(Array.from(n));
  }

  function alternarAcordeon(provincia: string) {
    setAbiertas((prev) => {
      const n = new Set(prev);
      if (n.has(provincia)) n.delete(provincia);
      else n.add(provincia);
      return n;
    });
  }

  const etiqueta =
    elegidas.length === 0
      ? "Todas las ciudades"
      : elegidas.length === 1
        ? elegidas[0]
        : `${elegidas.length} ciudades`;

  return (
    <div ref={caja} className="relative">
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        aria-expanded={abierto}
        className={`flex items-center gap-2 rounded-full border bg-white px-4 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-teal/30 ${
          elegidas.length ? "border-teal font-medium text-teal-dark" : "border-line text-ink"
        }`}
      >
        {etiqueta}
        <span aria-hidden className="text-xs text-ink-soft">▾</span>
      </button>

      {abierto && (
        <div className="absolute left-0 top-full z-30 mt-2 max-h-[70vh] w-72 overflow-y-auto rounded-2xl border border-line bg-white p-2 shadow-lg">
          {elegidas.length > 0 && (
            <button
              type="button"
              onClick={() => onCambio([])}
              className="mb-1 w-full rounded-lg px-3 py-2 text-left text-xs font-medium text-cyan hover:bg-paper-dim"
            >
              Ver todas las ciudades
            </button>
          )}
          {provincias.map((p) => {
            const total = p.ciudades.reduce((s, c) => s + c.n, 0);
            const marcadas = p.ciudades.filter((c) => sel.has(c.nombre)).length;
            const todas = marcadas === p.ciudades.length;
            const desplegada = abiertas.has(p.provincia) || provincias.length === 1;
            return (
              <div key={p.provincia} className="border-b border-line/60 last:border-0">
                <div className="flex items-center gap-2 px-2 py-2">
                  <input
                    type="checkbox"
                    checked={todas}
                    ref={(el) => {
                      if (el) el.indeterminate = marcadas > 0 && !todas;
                    }}
                    onChange={() => alternarProvincia(p)}
                    aria-label={`Toda la provincia de ${p.provincia}`}
                  />
                  <button
                    type="button"
                    onClick={() => alternarAcordeon(p.provincia)}
                    aria-expanded={desplegada}
                    className="flex flex-1 items-center justify-between text-left text-sm font-semibold text-teal-dark"
                  >
                    <span>
                      {p.provincia} <span className="font-normal text-ink-soft">({total})</span>
                    </span>
                    <span aria-hidden className="text-xs text-ink-soft">{desplegada ? "▴" : "▾"}</span>
                  </button>
                </div>
                {desplegada && (
                  <ul className="pb-2 pl-7">
                    {p.ciudades.map((c) => (
                      <li key={c.nombre}>
                        <label className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-ink hover:bg-paper-dim">
                          <input
                            type="checkbox"
                            checked={sel.has(c.nombre)}
                            onChange={() => alternarCiudad(c.nombre)}
                          />
                          <span className="flex-1">{c.nombre}</span>
                          <span className="text-xs text-ink-soft">{c.n}</span>
                        </label>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
