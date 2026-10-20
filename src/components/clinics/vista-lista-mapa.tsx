"use client";

import { useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { List, MapIcon } from "lucide-react";
import { ClinicCard } from "./clinic-card";
import { ClinicCardCompact } from "./clinic-card-compact";
import type { Clinic } from "@/lib/supabase/database.types";

// Leaflet solo funciona en el navegador (usa "window"/"document" al
// cargarse) y su JS no es pequeño — cargarlo solo cuando se abre la
// vista de mapa evita que ese peso entre en el bundle de "/centros"
// para quien nunca cambia de la vista de lista.
const ClinicsMap = dynamic(
  () => import("./clinics-map").then((m) => m.ClinicsMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full min-h-[420px] w-full items-center justify-center rounded-2xl bg-sage/40 text-sm text-ink-soft">
        Cargando mapa…
      </div>
    ),
  },
);

/**
 * Toggle Lista/Mapa controlado por el query param "vista" (igual que
 * ClinicFilters controla sus propios filtros) — así vive en la barra de
 * filtros, en vez de dentro de VistaListaMapa, sin tener que compartir
 * estado de React entre dos islas de cliente separadas.
 */
export function VistaToggle() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const vista = searchParams.get("vista") === "mapa" ? "mapa" : "lista";

  function elegir(valor: "lista" | "mapa") {
    const params = new URLSearchParams(searchParams.toString());
    if (valor === "lista") {
      params.delete("vista");
    } else {
      params.set("vista", valor);
    }
    startTransition(() => {
      const query = params.toString();
      router.push(query ? `${pathname}?${query}` : pathname);
    });
  }

  return (
    <div className="flex shrink-0 self-start rounded-full bg-paper-dim p-1 sm:self-auto">
      <button
        type="button"
        onClick={() => elegir("lista")}
        className={`press flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition sm:px-3.5 sm:py-1.5 sm:text-sm ${
          vista === "lista"
            ? "bg-teal-dark text-white"
            : "text-ink-soft hover:text-teal-dark"
        }`}
      >
        <List className="h-4 w-4" aria-hidden />
        Lista
      </button>
      <button
        type="button"
        onClick={() => elegir("mapa")}
        className={`press flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition sm:px-3.5 sm:py-1.5 sm:text-sm ${
          vista === "mapa"
            ? "bg-teal-dark text-white"
            : "text-ink-soft hover:text-teal-dark"
        }`}
      >
        <MapIcon className="h-4 w-4" aria-hidden />
        Mapa
      </button>
    </div>
  );
}

export function VistaListaMapa({
  clinicas,
  vista,
  idsDestacados = [],
  resaltarTecnica,
}: {
  clinicas: Clinic[];
  vista: "lista" | "mapa";
  resaltarTecnica?: string;
  /** Clínicas que salen arriba por visibilidad pagada en este listado. */
  idsDestacados?: string[];
}) {
  const destacados = new Set(idsDestacados);
  return (
    <div>
      {vista === "lista" ? (
        <div data-reveal-grupo className="mt-6 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
          {clinicas.map((clinic) => (
            <ClinicCard
              key={clinic.id}
              clinic={clinic}
              destacado={destacados.has(clinic.id)}
              resaltarTecnica={resaltarTecnica}
            />
          ))}
        </div>
      ) : (
        // A partir de lg, panel dividido: lista a la izquierda (más
        // estrecha), mapa fijo (sticky) a la derecha, ancho ~2 fichas.
        // Por debajo de lg no hay sitio para partir la pantalla, así que
        // el mapa ocupa toda la anchura y sustituye a la lista.
        <div className="mt-6 lg:flex lg:items-start lg:gap-6">
          <div className="lg:hidden">
            <ClinicsMap clinicas={clinicas} />
          </div>
          <div className="hidden lg:block lg:flex-1">
            <div className="grid grid-cols-3 gap-3 xl:grid-cols-4">
              {clinicas.map((clinic) => (
                <ClinicCardCompact key={clinic.id} clinic={clinic} destacado={destacados.has(clinic.id)} />
              ))}
            </div>
          </div>
          {/* top-28 en vez de top-8: dejar hueco de sobra para que no
              quede tapado bajo la barra de filtros, que ahora también es
              sticky (ver centros/page.tsx) y puede ocupar más de una
              línea de alto en pantallas más estrechas. */}
          <div className="hidden lg:sticky lg:top-28 lg:block lg:h-[calc(100vh-9rem)] lg:w-[560px] lg:shrink-0">
            <ClinicsMap clinicas={clinicas} alto="100%" />
          </div>
        </div>
      )}
    </div>
  );
}
