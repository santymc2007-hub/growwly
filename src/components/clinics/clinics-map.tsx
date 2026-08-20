"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Clinic } from "@/lib/supabase/database.types";
import { slugifyCiudad, slugifyProvincia } from "@/lib/clinic-options";

// Pin propio en SVG (evita el típico problema de Leaflet con las rutas
// de sus iconos por defecto al pasar por el bundler de Next).
const pinIcon = L.divIcon({
  className: "",
  html: `<svg width="30" height="40" viewBox="0 0 30 40" xmlns="http://www.w3.org/2000/svg">
    <path d="M15 0C6.7 0 0 6.7 0 15c0 10.5 15 25 15 25s15-14.5 15-25C30 6.7 23.3 0 15 0z" fill="#1f5568"/>
    <circle cx="15" cy="15" r="6" fill="white"/>
  </svg>`,
  iconSize: [30, 40],
  iconAnchor: [15, 40],
  popupAnchor: [0, -36],
});

type ClinicConCoords = Clinic & { lat: number; lng: number };

function AjustarVista({ clinicas }: { clinicas: ClinicConCoords[] }) {
  const map = useMap();
  useEffect(() => {
    if (clinicas.length === 0) return;
    if (clinicas.length === 1) {
      map.setView([clinicas[0].lat, clinicas[0].lng], 13);
      return;
    }
    const bounds = L.latLngBounds(clinicas.map((c) => [c.lat, c.lng]));
    map.fitBounds(bounds, { padding: [32, 32] });
  }, [clinicas, map]);
  return null;
}

export function ClinicsMap({
  clinicas,
  alto,
}: {
  clinicas: Clinic[];
  /** Alto del contenedor del mapa. Por defecto 420/480px (uso normal a
   * ancho completo); en el panel sticky del modo dividido se le pasa
   * "100%" para que llene el hueco disponible en pantalla. */
  alto?: string;
}) {
  const conCoords = useMemo(
    () =>
      clinicas.filter(
        (c): c is ClinicConCoords => c.lat != null && c.lng != null,
      ),
    [clinicas],
  );

  if (conCoords.length === 0) {
    return (
      <div
        className="flex items-center justify-center rounded-2xl border border-line bg-paper-dim text-sm text-ink-soft"
        style={{ height: alto ?? "420px" }}
      >
        Ninguna de las clínicas de este listado tiene ubicación cargada
        todavía.
      </div>
    );
  }

  // Centro inicial (Mallorca) — AjustarVista lo corrige al momento con
  // las coordenadas reales en cuanto el mapa monta.
  return (
    <div
      className="overflow-hidden rounded-2xl border border-line"
      style={{ height: alto ?? "420px" }}
    >
      <MapContainer
        center={[39.6, 2.9]}
        zoom={9}
        scrollWheelZoom={false}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <AjustarVista clinicas={conCoords} />
        {conCoords.map((c) => {
          const href = c.ciudad
            ? `/clinicas/${slugifyProvincia(c.provincia)}/${slugifyCiudad(c.ciudad)}/${c.slug}`
            : `/clinicas/${slugifyProvincia(c.provincia)}/sin-ciudad/${c.slug}`;
          return (
            <Marker key={c.id} position={[c.lat, c.lng]} icon={pinIcon}>
              <Popup>
                <div className="min-w-[160px]">
                  <p className="font-display text-sm font-bold text-teal-dark">
                    {c.nombre}
                  </p>
                  {c.ciudad && (
                    <p className="text-xs text-ink-soft">{c.ciudad}</p>
                  )}
                  <Link
                    href={href}
                    className="mt-1 inline-block text-xs font-semibold text-cyan hover:text-cyan-dark"
                  >
                    Ver ficha →
                  </Link>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
