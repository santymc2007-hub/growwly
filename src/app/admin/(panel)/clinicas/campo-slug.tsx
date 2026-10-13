"use client";

import { useEffect, useState } from "react";
import { slugify } from "@/lib/slugify";

const inputClass =
  "mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-teal/30";
const labelClass = "text-sm font-medium text-ink";

// Palabra clave de SEO local por tipo de negocio — mismos valores que
// TIPOS_NEGOCIO en @/lib/clinic-options, para construir slugs del tipo
// "clinica-capilar-palma-nombre" en vez de solo "nombre".
const PALABRA_SEO_POR_TIPO: Record<string, string> = {
  "Clínica capilar": "clinica-capilar",
  "Clínica de tricología": "clinica-tricologia",
  "Clínica estética": "clinica-estetica",
  "Clínica médica / hospital": "clinica-medica",
  "Centro de injertos capilares": "injerto-capilar",
  "Peluquería / centro de belleza con servicios capilares": "centro-capilar",
};

function leerValorCampo(id: string): string {
  const el = document.getElementById(id) as
    | HTMLInputElement
    | HTMLSelectElement
    | null;
  return el?.value.trim() ?? "";
}

function construirSugerencias(): string[] {
  const nombre = leerValorCampo("nombre");
  if (!nombre) return [];

  const base = slugify(nombre);
  const ciudad = slugify(leerValorCampo("ciudad"));
  const palabraSeo = PALABRA_SEO_POR_TIPO[leerValorCampo("tipo_negocio")] ?? "";

  const opciones = new Set<string>();
  opciones.add(base);
  if (ciudad) opciones.add(`${base}-${ciudad}`);
  if (palabraSeo) opciones.add(`${palabraSeo}-${base}`);
  if (ciudad && palabraSeo) opciones.add(`${palabraSeo}-${ciudad}-${base}`);

  return Array.from(opciones).filter(Boolean).slice(0, 4);
}

/**
 * Campo de slug de la clínica. Se autorrellena a partir del nombre (y,
 * si ya están rellenos, la ciudad y el tipo de negocio) para proponer
 * alternativas orientadas a SEO/GEO local — el admin puede elegir una
 * de un clic o escribir la suya.
 */
export function CampoSlug({ slugInicial }: { slugInicial?: string }) {
  const [slug, setSlug] = useState(slugInicial ?? "");
  const [sugerencias, setSugerencias] = useState<string[]>([]);
  const [tocadoAMano, setTocadoAMano] = useState(Boolean(slugInicial));

  function regenerarSugerencias() {
    const lista = construirSugerencias();
    setSugerencias(lista);
    if (!tocadoAMano && lista[0]) setSlug(lista[0]);
  }

  // Si es una clínica nueva (sin slug todavía), recalculamos solas las
  // sugerencias mientras el admin escribe el nombre.
  useEffect(() => {
    if (slugInicial) return;
    const nombreInput = document.getElementById("nombre");
    if (!nombreInput) return;
    const handler = () => regenerarSugerencias();
    nombreInput.addEventListener("input", handler);
    return () => nombreInput.removeEventListener("input", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <label className={labelClass} htmlFor="slug">
        URL / slug
      </label>
      <div className="mt-1 flex gap-2">
        <input
          id="slug"
          name="slug"
          value={slug}
          onChange={(e) => {
            setTocadoAMano(true);
            setSlug(slugify(e.target.value));
          }}
          required
          className={inputClass}
        />
        <button
          type="button"
          onClick={regenerarSugerencias}
          className="shrink-0 rounded-lg border border-line bg-white px-3 text-sm font-medium text-teal-dark hover:bg-paper-dim"
        >
          Sugerir
        </button>
      </div>
      <p className="mt-1 text-xs text-ink-soft">
        growwly.es/clinicas/.../.../{slug || "…"}
      </p>
      {sugerencias.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {sugerencias.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => {
                setTocadoAMano(true);
                setSlug(s);
              }}
              className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                s === slug
                  ? "bg-teal text-paper"
                  : "bg-sage text-sage-ink hover:bg-sage/70"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
