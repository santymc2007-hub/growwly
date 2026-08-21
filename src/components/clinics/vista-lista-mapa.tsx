"use client";

import { useState } from "react";
import { List, MapIcon } from "lucide-react";
import { ClinicCard } from "./clinic-card";
import { ClinicCardCompact } from "./clinic-card-compact";
import { ClinicsMap } from "./clinics-map";
import type { Clinic } from "@/lib/supabase/database.types";

export function VistaListaMapa({ clinicas }: { clinicas: Clinic[] }) {
  const [vista, setVista] = useState<"lista" | "mapa">("lista");

  return (
    <div>
      <div className="flex justify-end">
        <div className="inline-flex rounded-full border border-line bg-white p-1">
          <button
            type="button"
            onClick={() => setVista("lista")}
            className={`press flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
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
            onClick={() => setVista("mapa")}
            className={`press flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
              vista === "mapa"
                ? "bg-teal-dark text-white"
                : "text-ink-soft hover:text-teal-dark"
            }`}
          >
            <MapIcon className="h-4 w-4" aria-hidden />
            Mapa
          </button>
        </div>
      </div>

      {vista === "lista" ? (
        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {clinicas.map((clinic) => (
            <ClinicCard key={clinic.id} clinic={clinic} />
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
                <ClinicCardCompact key={clinic.id} clinic={clinic} />
              ))}
            </div>
          </div>
          <div className="hidden lg:sticky lg:top-8 lg:block lg:h-[calc(100vh-6rem)] lg:w-[560px] lg:shrink-0">
            <ClinicsMap clinicas={clinicas} alto="100%" />
          </div>
        </div>
      )}
    </div>
  );
}
