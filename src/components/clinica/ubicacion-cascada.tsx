"use client";

import { useState } from "react";
import { PROVINCIAS_ESPANA } from "@/lib/clinic-options";

type Municipio = { provincia: string; nombre: string };
type Zona = { municipio: string; nombre: string };

const inputClass =
  "mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-teal/30";
const labelClass = "text-sm font-medium text-ink";

export function UbicacionCascada({
  municipios,
  zonas,
  provinciaInicial,
  ciudadInicial,
  zonaInicial,
}: {
  municipios: Municipio[];
  zonas: Zona[];
  provinciaInicial?: string;
  ciudadInicial?: string | null;
  zonaInicial?: string | null;
}) {
  const [provincia, setProvincia] = useState(provinciaInicial || "Illes Balears");
  const [ciudad, setCiudad] = useState(ciudadInicial ?? "");

  const ciudadesDeProvincia = municipios
    .filter((m) => m.provincia === provincia)
    .map((m) => m.nombre)
    .sort((a, b) => a.localeCompare(b, "es"));

  const zonasDeCiudad = zonas
    .filter((z) => z.municipio === ciudad)
    .map((z) => z.nombre)
    .sort((a, b) => a.localeCompare(b, "es"));

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <div>
        <label className={labelClass} htmlFor="provincia">
          Provincia
        </label>
        <select
          id="provincia"
          name="provincia"
          value={provincia}
          onChange={(e) => {
            setProvincia(e.target.value);
            setCiudad(""); // la ciudad ya no aplica al cambiar de provincia
          }}
          className={inputClass}
        >
          {PROVINCIAS_ESPANA.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className={labelClass} htmlFor="ciudad">
          Ciudad
        </label>
        <select
          id="ciudad"
          name="ciudad"
          value={ciudad}
          onChange={(e) => setCiudad(e.target.value)}
          disabled={ciudadesDeProvincia.length === 0}
          className={inputClass}
        >
          <option value="">
            {ciudadesDeProvincia.length === 0
              ? "Sin municipios cargados en esta provincia todavía"
              : "Selecciona una ciudad"}
          </option>
          {ciudadesDeProvincia.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className={labelClass} htmlFor="zona">
          Zona / barrio{" "}
          <span className="font-normal text-ink-soft">(opcional)</span>
        </label>
        <select
          id="zona"
          name="zona"
          defaultValue={zonaInicial ?? ""}
          disabled={zonasDeCiudad.length === 0}
          className={inputClass}
        >
          <option value="">
            {zonasDeCiudad.length === 0 ? "Sin zonas para esta ciudad" : "Sin especificar"}
          </option>
          {zonasDeCiudad.map((z) => (
            <option key={z} value={z}>
              {z}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
