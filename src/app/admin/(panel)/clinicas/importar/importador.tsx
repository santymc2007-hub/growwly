"use client";

import { useActionState, useMemo, useState } from "react";
import Link from "next/link";
import {
  TECNICAS_POR_CATEGORIA,
  IDIOMAS_DISPONIBLES,
  TIPOS_NEGOCIO,
} from "@/lib/clinic-options";
import { normalizarIdiomas, normalizarTecnicas } from "@/lib/importador/normalizar";
import type { Clinic } from "@/lib/supabase/database.types";
import type {
  CandidatoGoogle,
  PropuestaImportacion,
  ResultadoAnalisis,
} from "@/lib/importador/tipos";
import { OverlayCargando } from "@/components/ui/overlay-cargando";
import { analizarClinica, guardarImportacion } from "./actions";

const inputClass =
  "mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-teal/30";
const labelClass = "text-sm font-medium text-ink";
const avisoClass = "rounded-lg bg-error/10 px-4 py-3 text-sm text-error-dark";

const MAX_FOTOS = 10;
const FOTOS_POR_DEFECTO = 5;

type Municipio = { provincia: string; nombre: string };

export function Importador({
  clinica,
  municipios,
}: {
  clinica: Clinic | null;
  municipios: Municipio[];
}) {
  const [resultado, analizar, analizando] = useActionState<ResultadoAnalisis | null, FormData>(
    analizarClinica,
    null,
  );
  const [verBusqueda, setVerBusqueda] = useState(true);

  const propuesta = resultado?.ok ? resultado.propuesta : null;
  // Mientras se analiza, la revisión se desmonta: así cada análisis nuevo
  // la monta desde cero, sin arrastrar selecciones del anterior.
  const mostrarRevision = propuesta && !verBusqueda && !analizando;

  return (
    <div>
      {analizando && (
        <OverlayCargando mensaje="Leyendo la web y buscando en Google Maps… (puede tardar hasta 40 segundos)" />
      )}

      {!mostrarRevision && (
        <form
          action={(fd) => {
            setVerBusqueda(false);
            return analizar(fd);
          }}
          className="max-w-2xl rounded-2xl border border-line bg-white p-5"
        >
          {resultado && !resultado.ok && <p className={`${avisoClass} mb-4`}>{resultado.error}</p>}
          {clinica && <input type="hidden" name="clinica_id" value={clinica.id} />}
          <div className="grid gap-4">
            <div>
              <label className={labelClass} htmlFor="web">
                Web de la clínica
              </label>
              <input
                id="web"
                name="web"
                defaultValue={clinica?.web?.split(/\s/)[0] ?? undefined}
                placeholder="clinicaejemplo.com"
                className={inputClass}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass} htmlFor="nombre">
                  Nombre
                </label>
                <input
                  id="nombre"
                  name="nombre"
                  defaultValue={clinica?.nombre}
                  placeholder="Para buscarla en Google Maps"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="municipio">
                  Municipio
                </label>
                <select
                  id="municipio"
                  name="municipio"
                  defaultValue={clinica?.ciudad ?? ""}
                  className={inputClass}
                >
                  <option value="">— Opcional —</option>
                  {municipios.map((m) => (
                    <option key={`${m.provincia}-${m.nombre}`} value={m.nombre}>
                      {m.nombre}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <p className="text-xs text-ink-soft">
              Con la web se sacan logo, fotos y tratamientos. Con el nombre (y mejor con municipio)
              se encuentra su ficha de Google Maps: dirección, coordenadas, horario y valoraciones.
            </p>
          </div>
          <div className="mt-5 flex items-center gap-3">
            <button
              type="submit"
              disabled={analizando}
              className="press rounded-lg bg-teal px-4 py-2 text-sm font-medium text-paper hover:bg-teal-dark disabled:opacity-60"
            >
              Analizar
            </button>
            {propuesta && (
              <button
                type="button"
                onClick={() => setVerBusqueda(false)}
                className="text-sm font-medium text-cyan hover:text-cyan-dark"
              >
                Volver a la última revisión
              </button>
            )}
          </div>
        </form>
      )}

      {mostrarRevision && (
        <Revision
          propuesta={propuesta}
          clinica={clinica}
          municipios={municipios}
          onNuevaBusqueda={() => setVerBusqueda(true)}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------
// Paso 2: revisión
// ---------------------------------------------------------------------

function elegirGoogleInicial(propuesta: PropuestaImportacion): number {
  if (propuesta.google.length === 0) return -1;
  const dominioWeb = propuesta.web?.urlFinal
    ? new URL(propuesta.web.urlFinal).hostname.replace(/^www\./, "")
    : null;
  if (dominioWeb) {
    const i = propuesta.google.findIndex((g) => g.web?.includes(dominioWeb));
    if (i >= 0) return i;
  }
  return 0;
}

function Revision({
  propuesta,
  clinica,
  municipios,
  onNuevaBusqueda,
}: {
  propuesta: PropuestaImportacion;
  clinica: Clinic | null;
  municipios: Municipio[];
  onNuevaBusqueda: () => void;
}) {
  const [estadoGuardado, guardar, guardando] = useActionState(guardarImportacion, null);
  const [googleIdx, setGoogleIdx] = useState(() => elegirGoogleInicial(propuesta));
  const g: CandidatoGoogle | null = googleIdx >= 0 ? propuesta.google[googleIdx] : null;
  const web = propuesta.web;

  const tecnicasIniciales = useMemo(() => {
    const deFicha = clinica ? normalizarTecnicas(clinica.tecnicas ?? []).tecnicas : [];
    return new Set([...deFicha, ...(web?.tecnicas ?? [])]);
  }, [clinica, web]);
  const idiomasIniciales = useMemo(() => {
    const deFicha = clinica ? normalizarIdiomas(clinica.idiomas ?? []) : [];
    return new Set([...deFicha, ...(web?.idiomas ?? [])]);
  }, [clinica, web]);

  const provincia = g?.provincia ?? clinica?.provincia ?? "Illes Balears";
  const municipiosProvincia = municipios.filter((m) => m.provincia === provincia);
  const googleBloqueado = Boolean(clinica?.google_place_id);

  return (
    <form action={guardar} className="grid gap-6">
      {guardando && <OverlayCargando mensaje="Descargando logo y fotos y guardando la ficha…" />}
      {estadoGuardado?.error && <p className={avisoClass}>{estadoGuardado.error}</p>}

      {clinica && <input type="hidden" name="clinica_id" value={clinica.id} />}
      <input type="hidden" name="google" value={g ? JSON.stringify(g) : ""} />
      <input type="hidden" name="provincia" value={provincia} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-ink-soft">
          Revisa lo encontrado. Nada se publica: la ficha {clinica ? "se completa" : "se crea oculta"} y
          te llevo a su formulario para terminarla.
        </p>
        <button
          type="button"
          onClick={onNuevaBusqueda}
          className="text-sm font-medium text-cyan hover:text-cyan-dark"
        >
          ← Cambiar búsqueda
        </button>
      </div>

      {(propuesta.errorWeb || propuesta.errorGoogle) && (
        <div className={avisoClass}>
          {propuesta.errorWeb && <p>Web: {propuesta.errorWeb}</p>}
          {propuesta.errorGoogle && <p>Google: {propuesta.errorGoogle}</p>}
        </div>
      )}

      {propuesta.existentes.length > 0 && (
        <div className="rounded-lg border border-orange/40 bg-yellow/15 px-4 py-3 text-sm text-ink">
          <p className="font-medium">Parece que esta clínica ya está en Growwly:</p>
          <ul className="mt-1 list-disc pl-5">
            {propuesta.existentes.map((c) => (
              <li key={c.id}>
                {c.nombre} <span className="text-ink-soft">({c.motivo})</span> ·{" "}
                <Link
                  href={`/admin/clinicas/importar?clinica=${c.id}`}
                  className="font-medium text-cyan hover:text-cyan-dark"
                >
                  Completar esa ficha
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ---------------- Google Maps ---------------- */}
      <Seccion titulo="Ficha de Google Maps">
        {googleBloqueado ? (
          <p className="text-sm text-ink-soft">
            Esta clínica ya tiene su ficha de Google vinculada; no se cambia desde aquí.
          </p>
        ) : propuesta.google.length === 0 ? (
          <p className="text-sm text-ink-soft">
            No se ha encontrado en Google Maps. Coordenadas, horario y valoraciones quedarán por
            rellenar.
          </p>
        ) : (
          <div className="grid gap-2">
            {propuesta.google.map((cand, i) => (
              <label
                key={cand.placeId}
                className={`flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-2.5 text-sm ${
                  i === googleIdx ? "border-teal bg-sage/40" : "border-line bg-white"
                }`}
              >
                <input
                  type="radio"
                  name="_google_idx"
                  checked={i === googleIdx}
                  onChange={() => setGoogleIdx(i)}
                  className="mt-1"
                />
                <span className="flex-1">
                  <span className="font-medium text-ink">{cand.nombre}</span>
                  {cand.rating !== null && (
                    <span className="ml-2 text-ink-soft">
                      ★ {cand.rating} ({cand.totalResenas ?? 0})
                    </span>
                  )}
                  <span className="block text-ink-soft">{cand.direccion}</span>
                  {cand.web && <span className="block text-xs text-ink-soft">{cand.web}</span>}
                </span>
                {cand.mapsUri && (
                  <a
                    href={cand.mapsUri}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-medium text-cyan hover:text-cyan-dark"
                  >
                    Ver en Maps
                  </a>
                )}
              </label>
            ))}
            <label className="flex cursor-pointer items-center gap-3 px-3 py-1 text-sm text-ink-soft">
              <input
                type="radio"
                name="_google_idx"
                checked={googleIdx === -1}
                onChange={() => setGoogleIdx(-1)}
              />
              Ninguna es esta clínica
            </label>
          </div>
        )}
      </Seccion>

      {/* ---------------- Datos ---------------- */}
      <Seccion titulo="Datos de la ficha">
        {clinica && (
          <p className="-mt-1 mb-3 text-xs text-ink-soft">
            Los campos que la ficha ya tiene rellenos aparecen bloqueados y no se tocan.
          </p>
        )}
        {/* key: al cambiar de ficha de Google se recargan sus valores */}
        <div key={googleIdx} className="grid gap-4 sm:grid-cols-2">
          {!clinica && (
            <Campo etiqueta="Nombre *" className="sm:col-span-2">
              <input
                name="nombre"
                required
                defaultValue={g?.nombre || web?.titulo || propuesta.nombreBuscado}
                className={inputClass}
              />
            </Campo>
          )}
          <Campo etiqueta="Tipo de negocio" actual={clinica?.tipo_negocio}>
            <select name="tipo_negocio" defaultValue="" className={inputClass}>
              <option value="">— Sin indicar —</option>
              {TIPOS_NEGOCIO.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </Campo>
          <Campo etiqueta="Web" actual={clinica?.web}>
            <input name="web" defaultValue={web?.urlFinal ?? g?.web ?? ""} className={inputClass} />
          </Campo>
          <Campo etiqueta="Descripción" actual={clinica?.descripcion} className="sm:col-span-2">
            <textarea
              name="descripcion"
              rows={3}
              defaultValue={web?.descripcion ?? ""}
              className={inputClass}
            />
          </Campo>
          <Campo etiqueta="Dirección" actual={clinica?.direccion} className="sm:col-span-2">
            <input
              name="direccion"
              defaultValue={g?.direccion || web?.direccion || ""}
              className={inputClass}
            />
          </Campo>
          <Campo etiqueta={`Municipio (${provincia})`} actual={clinica?.ciudad}>
            <select name="ciudad" defaultValue={g?.ciudad ?? ""} className={inputClass}>
              <option value="">— Sin indicar —</option>
              {municipiosProvincia.map((m) => (
                <option key={m.nombre} value={m.nombre}>
                  {m.nombre}
                </option>
              ))}
            </select>
          </Campo>
          <Campo etiqueta="Teléfono" actual={clinica?.telefono}>
            <input
              name="telefono"
              defaultValue={g?.telefono || web?.telefono || ""}
              className={inputClass}
            />
          </Campo>
          <Campo etiqueta="Email" actual={clinica?.email}>
            <input name="email" type="email" defaultValue={web?.email ?? ""} className={inputClass} />
          </Campo>
          <Campo etiqueta="Oferta actual" actual={clinica?.detalle_oferta}>
            <input
              name="detalle_oferta"
              defaultValue={web?.oferta ?? ""}
              className={inputClass}
            />
          </Campo>
          <Campo etiqueta="Notas de precio" actual={clinica?.rango_precios} className="sm:col-span-2">
            <input
              name="rango_precios"
              defaultValue={web?.precios ?? ""}
              className={inputClass}
            />
          </Campo>
          <div className="flex flex-wrap gap-x-6 gap-y-2 sm:col-span-2">
            <label className="flex items-center gap-2 text-sm text-ink">
              <input
                type="checkbox"
                name="financiacion"
                defaultChecked={Boolean(web?.financiacion) || Boolean(clinica?.financiacion)}
              />
              Financiación
            </label>
            <label className="flex items-center gap-2 text-sm text-ink">
              <input
                type="checkbox"
                name="primera_consulta_gratis"
                defaultChecked={
                  Boolean(web?.primeraConsultaGratis) || Boolean(clinica?.primera_consulta_gratis)
                }
              />
              Primera consulta gratis
            </label>
          </div>
        </div>

        {g && (
          <p className="mt-4 text-xs text-ink-soft">
            De Google se guardan también: coordenadas
            {g.horariosEstructurados.length ? ", horario" : ""}
            {g.rating !== null ? ", valoración" : ""}
            {g.accesibilidadChecks.length ? ", accesibilidad" : ""}.
            {g.horariosTexto && <span className="mt-1 block">Horario: {g.horariosTexto}</span>}
          </p>
        )}
      </Seccion>

      {/* ---------------- Técnicas e idiomas ---------------- */}
      <Seccion titulo="Tratamientos">
        {web && web.tratamientosSinClasificar.length > 0 && (
          <p className="mb-3 rounded-lg bg-paper-dim px-3 py-2 text-xs text-ink-soft">
            En la web aparecen también, sin encajar en el catálogo:{" "}
            <span className="text-ink">{web.tratamientosSinClasificar.join(" · ")}</span>
          </p>
        )}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Object.entries(TECNICAS_POR_CATEGORIA).map(([categoria, tecnicas]) => (
            <div key={categoria}>
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
                {categoria}
              </p>
              <div className="mt-2 grid gap-1.5">
                {tecnicas.map((t) => (
                  <label key={t} className="flex items-center gap-2 text-sm text-ink">
                    <input
                      type="checkbox"
                      name="tecnicas"
                      value={t}
                      defaultChecked={tecnicasIniciales.has(t)}
                    />
                    {t}
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
        <p className="mt-5 text-xs font-semibold uppercase tracking-wide text-ink-soft">Idiomas</p>
        <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1.5">
          {IDIOMAS_DISPONIBLES.map((i) => (
            <label key={i} className="flex items-center gap-2 text-sm text-ink">
              <input
                type="checkbox"
                name="idiomas"
                value={i}
                defaultChecked={idiomasIniciales.has(i)}
              />
              {i}
            </label>
          ))}
        </div>
      </Seccion>

      {/* ---------------- Redes ---------------- */}
      <Seccion titulo="Redes sociales">
        <div className="grid gap-4 sm:grid-cols-2">
          {(["instagram", "facebook", "tiktok", "linkedin"] as const).map((red) => {
            const actual =
              clinica && clinica.redes_sociales && typeof clinica.redes_sociales === "object"
                ? (clinica.redes_sociales as Record<string, string>)[red]
                : null;
            return (
              <Campo
                key={red}
                etiqueta={red[0].toUpperCase() + red.slice(1)}
                actual={clinica && Object.keys(clinica.redes_sociales ?? {}).length ? actual ?? "—" : null}
              >
                <input
                  name={`red_${red}`}
                  defaultValue={web?.redes[red] ?? ""}
                  className={inputClass}
                />
              </Campo>
            );
          })}
        </div>
      </Seccion>

      {/* ---------------- Logo ---------------- */}
      <Seccion titulo="Logo">
        <SelectorLogo logos={web?.logos ?? []} logoActual={clinica?.logo_url ?? null} />
      </Seccion>

      {/* ---------------- Fotos ---------------- */}
      <Seccion titulo="Fotos">
        <SelectorFotos fotos={web?.fotos ?? []} yaTiene={clinica?.fotos?.length ?? 0} />
      </Seccion>

      <div className="sticky bottom-0 -mx-1 flex flex-wrap items-center gap-3 border-t border-line bg-paper-dim/95 px-1 py-4 backdrop-blur">
        <button
          type="submit"
          disabled={guardando}
          className="press rounded-lg bg-teal px-5 py-2.5 text-sm font-medium text-paper hover:bg-teal-dark disabled:opacity-60"
        >
          {clinica ? "Completar la ficha" : "Crear ficha (sin publicar)"}
        </button>
        <span className="text-xs text-ink-soft">
          Después se abre su formulario para revisar, ajustar horario y publicar.
        </span>
      </div>
    </form>
  );
}

function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-line bg-white p-5">
      <h2 className="mb-4 font-display text-lg text-teal-dark">{titulo}</h2>
      {children}
    </section>
  );
}

/**
 * En modo "completar", un campo que la ficha ya tiene se enseña
 * bloqueado con su valor actual (el servidor tampoco lo tocaría).
 */
function Campo({
  etiqueta,
  actual,
  className = "",
  children,
}: {
  etiqueta: string;
  actual?: string | null;
  className?: string;
  children: React.ReactNode;
}) {
  const bloqueado = typeof actual === "string" && actual.trim() !== "";
  return (
    <div className={className}>
      <span className={labelClass}>{etiqueta}</span>
      {bloqueado ? (
        <p className="mt-1 rounded-lg border border-line bg-paper-dim px-3 py-2 text-sm text-ink-soft">
          {actual}
        </p>
      ) : (
        children
      )}
    </div>
  );
}

// ---------------------------------------------------------------------
// Logo
// ---------------------------------------------------------------------

function SelectorLogo({ logos, logoActual }: { logos: string[]; logoActual: string | null }) {
  const [elegido, setElegido] = useState(logos[0] ?? "");
  const [rotos, setRotos] = useState<Set<string>>(new Set());
  const visibles = logos.filter((l) => !rotos.has(l));

  return (
    <div>
      <input type="hidden" name="logo" value={rotos.has(elegido) ? "" : elegido} />
      {logoActual && (
        <div className="mb-4 flex items-center gap-4">
          <div className="flex h-[58px] w-[138px] items-center justify-center rounded-lg border border-line bg-white p-1.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logoActual} alt="" className="max-h-full max-w-full object-contain" />
          </div>
          <label className="flex items-center gap-2 text-sm text-ink">
            <input type="checkbox" name="reemplazar_logo" />
            Reemplazar el logo actual por el elegido abajo
          </label>
        </div>
      )}
      {visibles.length === 0 ? (
        <p className="text-sm text-ink-soft">No se ha encontrado logo en la web.</p>
      ) : (
        <div className="flex flex-wrap gap-3">
          {visibles.map((logo) => (
            <label
              key={logo}
              className={`flex cursor-pointer flex-col items-center gap-2 rounded-lg border p-2 ${
                elegido === logo ? "border-teal bg-sage/40" : "border-line"
              }`}
            >
              <div className="flex h-[58px] w-[138px] items-center justify-center rounded border border-line bg-white p-1.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={logo}
                  alt=""
                  referrerPolicy="no-referrer"
                  className="max-h-full max-w-full object-contain"
                  onError={() => setRotos((r) => new Set(r).add(logo))}
                />
              </div>
              <input
                type="radio"
                name="_logo"
                checked={elegido === logo}
                onChange={() => setElegido(logo)}
              />
            </label>
          ))}
          <label className="flex cursor-pointer items-center gap-2 px-2 text-sm text-ink-soft">
            <input type="radio" name="_logo" checked={elegido === ""} onChange={() => setElegido("")} />
            Sin logo
          </label>
        </div>
      )}
      <p className="mt-3 text-xs text-ink-soft">
        Si el logo de la web es blanco (para fondos oscuros) aquí no se verá bien: mejor súbelo a mano.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------
// Fotos
// ---------------------------------------------------------------------

type Medida = { w: number; h: number } | "rota";

function SelectorFotos({
  fotos,
  yaTiene,
}: {
  fotos: { url: string; stock: boolean }[];
  yaTiene: number;
}) {
  const [medidas, setMedidas] = useState<Record<string, Medida>>({});
  const [manual, setManual] = useState<Set<string> | null>(null);

  // Hasta que el admin toque algo, se proponen las primeras fotos reales
  // (no de banco de imágenes) que midan al menos 600px de ancho y no
  // sean tiras/banners raros.
  const automaticas = useMemo(() => {
    const elegidas = new Set<string>();
    for (const f of fotos) {
      if (elegidas.size >= FOTOS_POR_DEFECTO) break;
      const m = medidas[f.url];
      if (f.stock || !m || m === "rota") continue;
      const proporcion = m.w / m.h;
      if (m.w >= 600 && proporcion > 0.6 && proporcion < 2.4) elegidas.add(f.url);
    }
    return elegidas;
  }, [fotos, medidas]);

  const seleccion = manual ?? automaticas;
  const visibles = fotos.filter((f) => {
    const m = medidas[f.url];
    return m !== "rota" && !(m && m.w < 250);
  });

  function alternar(url: string) {
    const nueva = new Set(seleccion);
    if (nueva.has(url)) nueva.delete(url);
    else if (nueva.size < MAX_FOTOS) nueva.add(url);
    setManual(nueva);
  }

  if (fotos.length === 0) {
    return <p className="text-sm text-ink-soft">No se han encontrado fotos en la web.</p>;
  }

  return (
    <div>
      {Array.from(seleccion).map((url) => (
        <input key={url} type="hidden" name="fotos" value={url} />
      ))}
      <p className="mb-3 text-sm text-ink-soft">
        {seleccion.size} seleccionadas (máx. {MAX_FOTOS})
        {yaTiene > 0 && ` · la ficha ya tiene ${yaTiene}, estas se añaden`}. Las marcadas como
        “banco de imágenes” no son fotos reales de la clínica.
      </p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
        {visibles.map((f) => {
          const m = medidas[f.url];
          const activa = seleccion.has(f.url);
          return (
            <button
              key={f.url}
              type="button"
              onClick={() => alternar(f.url)}
              className={`group relative overflow-hidden rounded-lg border-2 text-left ${
                activa ? "border-teal" : "border-transparent"
              }`}
            >
              <div className="aspect-[4/3] bg-paper-dim">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={f.url}
                  alt=""
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  className={`h-full w-full object-cover ${activa ? "" : "opacity-70 group-hover:opacity-100"}`}
                  onLoad={(e) => {
                    const { naturalWidth: w, naturalHeight: h } = e.currentTarget;
                    setMedidas((prev) => ({ ...prev, [f.url]: { w, h } }));
                  }}
                  onError={() => setMedidas((prev) => ({ ...prev, [f.url]: "rota" }))}
                />
              </div>
              <span
                className={`absolute left-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold ${
                  activa ? "bg-teal text-paper" : "bg-white/90 text-ink-soft"
                }`}
              >
                {activa ? "✓" : ""}
              </span>
              <span className="flex items-center justify-between gap-1 bg-white px-1.5 py-1 text-[11px] text-ink-soft">
                <span>{m && m !== "rota" ? `${m.w}×${m.h}` : "…"}</span>
                {f.stock && (
                  <span className="rounded bg-orange/20 px-1 text-[10px] font-medium text-ink">
                    banco de imágenes
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
