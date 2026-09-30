"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

type Clinica = { id: string; nombre: string; provincia: string };

export function FiltrosEstadisticasAdmin({
  provincias,
  clinicas,
}: {
  provincias: string[];
  clinicas: Clinica[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const provinciaActiva = searchParams.get("provincia") ?? "";
  const clinicaActiva = searchParams.get("clinica") ?? "";

  const clinicasVisibles = provinciaActiva
    ? clinicas.filter((c) => c.provincia === provinciaActiva)
    : clinicas;

  function actualizar(cambios: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(cambios)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    router.push(params.toString() ? `${pathname}?${params.toString()}` : pathname);
  }

  return (
    <div className="flex flex-wrap gap-2">
      <div className="relative">
        <select
          value={provinciaActiva}
          onChange={(e) =>
            // Al cambiar de provincia, la clínica seleccionada (si era de
            // otra) deja de tener sentido — se limpia también.
            actualizar({ provincia: e.target.value, clinica: "" })
          }
          aria-label="Provincia"
          className="appearance-none rounded-full border border-line bg-white px-4 py-2 pr-9 text-sm text-ink shadow-sm transition hover:border-teal/40 focus:outline-none focus:ring-2 focus:ring-teal/30"
        >
          <option value="">Todas las provincias</option>
          {provincias.map((p) => (
            <option key={p} value={p}>
              {p}
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

      <div className="relative">
        <select
          value={clinicaActiva}
          onChange={(e) => actualizar({ clinica: e.target.value })}
          aria-label="Clínica"
          className="appearance-none rounded-full border border-line bg-white px-4 py-2 pr-9 text-sm text-ink shadow-sm transition hover:border-teal/40 focus:outline-none focus:ring-2 focus:ring-teal/30"
        >
          <option value="">Todas las clínicas</option>
          {clinicasVisibles.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre}
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
  );
}
