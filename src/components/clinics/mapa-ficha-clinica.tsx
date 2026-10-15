"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { MapPin } from "lucide-react";
import { BotonContactoClinica } from "@/components/analytics/boton-contacto-clinica";
import type { Clinic } from "@/lib/supabase/database.types";

// Leaflet solo funciona en el navegador — igual que en vista-lista-mapa.tsx,
// se carga solo al desplegar el mapa, no en el bundle inicial de la ficha.
const ClinicsMap = dynamic(
  () => import("./clinics-map").then((m) => m.ClinicsMap),
  {
    ssr: false,
    loading: () => (
      <div className="mt-3 flex h-[220px] w-full items-center justify-center rounded-2xl bg-sage/40 text-sm text-ink-soft">
        Cargando mapa…
      </div>
    ),
  },
);

/**
 * "Ver en el mapa" de la ficha pública: en vez de solo abrir Google
 * Maps en una pestaña nueva, despliega un mapa embebido justo debajo
 * (entre Dirección y Horario) si hay coordenadas propias. Si no hay
 * lat/lng pero sí un google_maps_url, no hay mapa que embeber — se
 * mantiene el link externo normal.
 */
export function MapaFichaClinica({ clinic }: { clinic: Clinic }) {
  const [abierto, setAbierto] = useState(false);
  const tieneCoords = clinic.lat != null && clinic.lng != null;
  const href =
    clinic.google_maps_url ||
    (tieneCoords ? `https://www.google.com/maps?q=${clinic.lat},${clinic.lng}` : null);

  if (!href) return null;

  return (
    <div>
      <BotonContactoClinica
        href={href}
        target="_blank"
        rel="noreferrer"
        onClick={(e) => {
          if (!tieneCoords) return;
          // Con coordenadas propias, el clic despliega el mapa embebido
          // en vez de navegar — Google Maps sigue disponible dentro del
          // panel desplegado, por si se quiere abrir aparte.
          e.preventDefault();
          setAbierto((v) => !v);
        }}
        className="mt-2 inline-flex items-center gap-1.5 text-sm text-cyan hover:text-cyan-dark"
        clinicId={clinic.id}
        metodo="ver_mapa"
      >
        <MapPin className="h-4 w-4" aria-hidden />
        Ver en el mapa {tieneCoords ? (abierto ? "▴" : "▾") : "↗"}
      </BotonContactoClinica>

      {abierto && tieneCoords && (
        <div className="mt-3">
          <ClinicsMap clinicas={[clinic]} alto="220px" ocultarEnlaceFicha />
          <a
            href={href}
            target="_blank"
            rel="noreferrer"
            className="mt-1.5 inline-block text-xs text-cyan hover:text-cyan-dark"
          >
            Abrir en Google Maps ↗
          </a>
        </div>
      )}
    </div>
  );
}
