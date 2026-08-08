"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";

type Props = {
  ciudades: string[];
};

export function AdminClinicFilters({ ciudades }: Props) {
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

      <select
        value={searchParams.get("ciudad") ?? ""}
        onChange={(e) => updateParam("ciudad", e.target.value)}
        className="rounded-full border border-line bg-white px-4 py-2 text-sm text-ink shadow-sm focus:outline-none focus:ring-2 focus:ring-teal/30"
      >
        <option value="">Todas las ciudades</option>
        {ciudades.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>

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
