"use client";

import { useState, type ReactNode } from "react";
import { List, MapIcon } from "lucide-react";
import { ClinicsMap } from "./clinics-map";
import type { Clinic } from "@/lib/supabase/database.types";

export function VistaListaMapa({
  clinicas,
  children,
}: {
  clinicas: Clinic[];
  children: ReactNode;
}) {
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

      <div className="mt-6">
        {vista === "lista" ? children : <ClinicsMap clinicas={clinicas} />}
      </div>
    </div>
  );
}
