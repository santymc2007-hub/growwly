"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import {
  TECNICAS_DISPONIBLES,
  IDIOMAS_DISPONIBLES,
  PRECIO_OPCIONES,
  MUNICIPIOS_MALLORCA,
  TIPOS_NEGOCIO,
  formatearPrecio,
} from "@/lib/clinic-options";
import { getRawSocialValue } from "@/lib/social-links";
import type { Clinic } from "@/lib/supabase/database.types";
import { HorarioSemanal } from "@/components/clinica/horario-semanal";
import { comprimirFormData } from "@/lib/comprimir-imagen";

type Props = {
  clinic: Clinic;
  action: (formData: FormData) => void;
};

const inputClass =
  "mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-teal/30";
const labelClass = "text-sm font-medium text-ink";

export function FichaClinicaForm({ clinic, action }: Props) {
  const [estado, setEstado] = useState<"idle" | "comprimiendo" | "enviando">("idle");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setEstado("comprimiendo");
    try {
      const original = new FormData(e.currentTarget);
      const comprimido = await comprimirFormData(original);
      setEstado("enviando");
      await action(comprimido);
      // La action redirige internamente al terminar (tanto si va bien
      // como si hay error), así que normalmente no se llega más allá.
    } finally {
      setEstado("idle");
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-8">
      {clinic.plan !== "premium" && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-gradient-to-r from-brand-green to-brand-blue p-5">
          <div>
            <p className="font-display text-lg font-bold text-teal-dark">
              ✦ Pasa a Premium
            </p>
            <p className="mt-1 text-sm text-teal-dark/80">
              Desbloquea precios visibles, fotos antes/después, opiniones de
              pacientes, diplomas, ofertas y otros servicios en tu ficha.
            </p>
          </div>
          <Link
            href="/clinica/visibilidad"
            className="whitespace-nowrap rounded-full bg-white px-5 py-2.5 text-sm font-bold text-teal-dark shadow transition hover:opacity-90"
          >
            Solicitar Premium →
          </Link>
        </div>
      )}

      <section>
        <h2 className="font-display text-lg text-teal-dark">Lo básico</h2>
        <div className="mt-4 grid gap-4">
          <div>
            <label htmlFor="logo" className={labelClass}>
              Logo de la clínica
            </label>
            {clinic.logo_url && (
              <div className="relative mt-2 h-16 w-16 overflow-hidden rounded-full border border-line">
                <Image src={clinic.logo_url} alt="" fill sizes="64px" className="object-cover" />
              </div>
            )}
            <input
              id="logo"
              name="logo"
              type="file"
              accept="image/*"
              className="mt-2 block w-full text-sm text-ink-soft file:mr-3 file:rounded-lg file:border-0 file:bg-sage file:px-3 file:py-2 file:text-sm file:font-medium file:text-sage-ink"
            />
          </div>
          <div>
            <label className={labelClass}>
              Fotos de la clínica{" "}
              <span className="font-normal text-ink-soft">(hasta 5)</span>
            </label>

            {clinic.fotos.length > 0 && (
              <div className="mt-2 grid grid-cols-3 gap-3 sm:grid-cols-5">
                {clinic.fotos.map((foto) => (
                  <div key={foto}>
                    <div className="relative aspect-square overflow-hidden rounded-lg border border-line bg-sage">
                      <Image src={foto} alt="" fill sizes="100px" className="object-cover" />
                    </div>
                    <label className="mt-1 flex items-center gap-1.5 text-xs text-ink-soft">
                      <input type="checkbox" name="fotos_eliminar" value={foto} />
                      Eliminar
                    </label>
                  </div>
                ))}
              </div>
            )}
            <input type="hidden" name="fotos_actuales" value={JSON.stringify(clinic.fotos)} />

            <input
              id="fotos_nuevas"
              name="fotos_nuevas"
              type="file"
              accept="image/*"
              multiple
              className="mt-2 block w-full text-sm text-ink-soft file:mr-3 file:rounded-lg file:border-0 file:bg-sage file:px-3 file:py-2 file:text-sm file:font-medium file:text-sage-ink"
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="descripcion">
              Descripción
            </label>
            <textarea
              id="descripcion"
              name="descripcion"
              rows={3}
              defaultValue={clinic.descripcion ?? undefined}
              className={inputClass}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass} htmlFor="telefono">
                Teléfono
              </label>
              <input
                id="telefono"
                name="telefono"
                defaultValue={clinic.telefono ?? undefined}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="email">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                defaultValue={clinic.email ?? undefined}
                className={inputClass}
              />
            </div>
          </div>
          <div>
            <label className={labelClass} htmlFor="web">
              Web
            </label>
            <input
              id="web"
              name="web"
              defaultValue={clinic.web ?? undefined}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="direccion">
              Dirección
            </label>
            <input
              id="direccion"
              name="direccion"
              defaultValue={clinic.direccion ?? undefined}
              className={inputClass}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass} htmlFor="ciudad">
                Ciudad
              </label>
              <select
                id="ciudad"
                name="ciudad"
                defaultValue={clinic.ciudad ?? ""}
                className={inputClass}
              >
                <option value="">Selecciona un municipio</option>
                {MUNICIPIOS_MALLORCA.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass} htmlFor="zona">
                Zona/Barrio
              </label>
              <input
                id="zona"
                name="zona"
                defaultValue={clinic.zona ?? undefined}
                className={inputClass}
              />
            </div>
          </div>
        </div>
      </section>

      <section>
        <h2 className="font-display text-lg text-teal-dark">
          Redes sociales
        </h2>
        <div className="mt-4 grid grid-cols-2 gap-4">
          {(["instagram", "facebook", "tiktok"] as const).map((red) => (
            <div key={red}>
              <label className={labelClass} htmlFor={`red_${red}`}>
                {red === "instagram"
                  ? "Instagram"
                  : red === "facebook"
                    ? "Facebook"
                    : "TikTok"}
              </label>
              <input
                id={`red_${red}`}
                name={`red_${red}`}
                placeholder="@usuario"
                defaultValue={
                  getRawSocialValue(clinic.redes_sociales, red) ?? undefined
                }
                className={inputClass}
              />
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-display text-lg text-teal-dark">
          Técnicas e idiomas
        </h2>
        <div className="mt-4">
          <p className={labelClass}>Técnicas que ofrecéis</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {TECNICAS_DISPONIBLES.map((t) => (
              <label
                key={t}
                className="flex items-center gap-1.5 rounded-full border border-line bg-white px-3 py-1.5 text-sm"
              >
                <input
                  type="checkbox"
                  name="tecnicas"
                  value={t}
                  defaultChecked={clinic.tecnicas?.includes(t)}
                />
                {t}
              </label>
            ))}
          </div>
        </div>
        <div className="mt-4">
          <p className={labelClass}>Idiomas de atención</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {IDIOMAS_DISPONIBLES.map((idioma) => (
              <label
                key={idioma}
                className="flex items-center gap-1.5 rounded-full border border-line bg-white px-3 py-1.5 text-sm"
              >
                <input
                  type="checkbox"
                  name="idiomas"
                  value={idioma}
                  defaultChecked={clinic.idiomas?.includes(idioma)}
                />
                {idioma}
              </label>
            ))}
          </div>
        </div>
      </section>

      <section>
        <h2 className="font-display text-lg text-teal-dark">
          Servicios y precios
        </h2>
        <div className="mt-4 grid gap-4">
          <div>
            <label className={labelClass} htmlFor="tipo_negocio">
              Tipo de negocio
            </label>
            <select
              id="tipo_negocio"
              name="tipo_negocio"
              defaultValue={clinic.tipo_negocio ?? ""}
              className={inputClass}
            >
              <option value="">Selecciona un tipo</option>
              {TIPOS_NEGOCIO.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass} htmlFor="servicios_adicionales">
              Otros servicios (separados por coma)
            </label>
            <input
              id="servicios_adicionales"
              name="servicios_adicionales"
              defaultValue={clinic.servicios_adicionales?.join(", ") ?? undefined}
              className={inputClass}
            />
          </div>
          <div>
            <p className={labelClass}>Rango de precios (solo injerto capilar)</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="precio_desde"
                  className="block text-xs text-ink-soft"
                >
                  Desde
                </label>
                <select
                  id="precio_desde"
                  name="precio_desde"
                  defaultValue={clinic.precio_desde ?? ""}
                  className={inputClass}
                >
                  <option value="">Sin especificar</option>
                  {PRECIO_OPCIONES.map((valor) => (
                    <option key={valor} value={valor}>
                      {formatearPrecio(valor)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  htmlFor="precio_hasta"
                  className="block text-xs text-ink-soft"
                >
                  Hasta
                </label>
                <select
                  id="precio_hasta"
                  name="precio_hasta"
                  defaultValue={clinic.precio_hasta ?? ""}
                  className={inputClass}
                >
                  <option value="">Sin especificar</option>
                  {PRECIO_OPCIONES.map((valor) => (
                    <option key={valor} value={valor}>
                      {formatearPrecio(valor)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          <div>
            <label className={labelClass} htmlFor="rango_precios">
              Notas de precio (opcional)
            </label>
            <input
              id="rango_precios"
              name="rango_precios"
              defaultValue={clinic.rango_precios ?? undefined}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Horario</label>
            <div className="mt-2 rounded-xl border border-line bg-white p-4">
              <HorarioSemanal valorInicial={clinic.horarios_estructurados} />
            </div>
          </div>
          <div>
            <label className={labelClass} htmlFor="accesibilidad">
              Accesibilidad
            </label>
            <input
              id="accesibilidad"
              name="accesibilidad"
              defaultValue={clinic.accesibilidad ?? undefined}
              className={inputClass}
            />
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-2">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="financiacion"
              defaultChecked={clinic.financiacion}
            />
            Ofrecemos financiación
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="primera_consulta_gratis"
              defaultChecked={clinic.primera_consulta_gratis}
            />
            Primera consulta gratis
          </label>
        </div>
      </section>

      <section className="mt-2 rounded-xl border border-cyan/30 bg-cyan/5 p-4">
        <h2 className="font-display text-lg text-teal-dark">
          Contenido Premium
        </h2>
        {clinic.plan === "premium" ? (
          <p className="mt-1 text-sm text-ink-soft">
            Visible en tu ficha pública.
          </p>
        ) : (
          <p className="mt-1 text-sm text-ink-soft">
            Puedes rellenarlo ya — se guarda, pero no se publica hasta que
            actives el plan Premium.{" "}
            <Link href="/clinica/visibilidad" className="font-medium text-cyan-dark hover:underline">
              Solicitar Premium →
            </Link>
          </p>
        )}

        <div className="mt-4">
          <label htmlFor="detalle_oferta" className={labelClass}>
            Oferta activa
          </label>
          <input
              id="detalle_oferta"
              name="detalle_oferta"
              placeholder="Ej. 20% de descuento en primera sesión (déjalo vacío si no tienes ninguna)"
              defaultValue={clinic.detalle_oferta ?? undefined}
              className={inputClass}
            />
          </div>

          <div className="mt-6">
            <label htmlFor="descripcion_extendida" className={labelClass}>
              Descripción extendida
            </label>
            <p className="mt-0.5 text-xs text-ink-soft">
              Amplía la descripción corta — tu enfoque, equipo, instalaciones.
              Admite formato Markdown (títulos con #, negrita con **texto**).
            </p>
            <textarea
              id="descripcion_extendida"
              name="descripcion_extendida"
              rows={5}
              defaultValue={clinic.descripcion_extendida ?? undefined}
              className={`${inputClass} mt-2`}
            />
          </div>

          <div className="mt-6">
            <label htmlFor="video_url" className={labelClass}>
              Vídeo (YouTube o Vimeo)
            </label>
            <input
              id="video_url"
              name="video_url"
              type="url"
              placeholder="https://www.youtube.com/watch?v=..."
              defaultValue={clinic.video_url ?? undefined}
              className={`${inputClass} mt-1`}
            />
          </div>

          <div className="mt-6">
            <p className={labelClass}>Equipo médico (hasta 3)</p>
            {[0, 1, 2].map((i) => {
              const medico = Array.isArray(clinic.medicos)
                ? (clinic.medicos as { nombre?: string; especialidad?: string }[])[i]
                : undefined;
              return (
                <div key={i} className="mt-2 grid grid-cols-2 gap-2">
                  <input
                    name={`medico_nombre_${i}`}
                    placeholder="Nombre"
                    defaultValue={medico?.nombre ?? undefined}
                    className={inputClass}
                  />
                  <input
                    name={`medico_especialidad_${i}`}
                    placeholder="Especialidad (ej. Cirujano capilar)"
                    defaultValue={medico?.especialidad ?? undefined}
                    className={inputClass}
                  />
                </div>
              );
            })}
          </div>

          <div className="mt-6">
            <p className={labelClass}>Fotos antes / después (hasta 3 pares)</p>
            {[0, 1, 2].map((i) => {
              const par = Array.isArray(clinic.fotos_antes_despues)
                ? (clinic.fotos_antes_despues as { antes?: string; despues?: string }[])[i]
                : undefined;
              return (
                <div key={i} className="mt-2 grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor={`antes_${i}`} className="block text-xs text-ink-soft">
                      Antes {i + 1}
                    </label>
                    <input
                      id={`antes_${i}`}
                      name={`antes_${i}`}
                      type="file"
                      accept="image/*"
                      className="mt-1 block w-full text-xs text-ink-soft file:mr-2 file:rounded-lg file:border-0 file:bg-sage file:px-2 file:py-1.5 file:text-xs file:font-medium file:text-sage-ink"
                    />
                    {par?.antes && (
                      <p className="mt-1 text-xs text-ink-soft">Ya tiene foto — sube otra para sustituirla.</p>
                    )}
                  </div>
                  <div>
                    <label htmlFor={`despues_${i}`} className="block text-xs text-ink-soft">
                      Después {i + 1}
                    </label>
                    <input
                      id={`despues_${i}`}
                      name={`despues_${i}`}
                      type="file"
                      accept="image/*"
                      className="mt-1 block w-full text-xs text-ink-soft file:mr-2 file:rounded-lg file:border-0 file:bg-sage file:px-2 file:py-1.5 file:text-xs file:font-medium file:text-sage-ink"
                    />
                    {par?.despues && (
                      <p className="mt-1 text-xs text-ink-soft">Ya tiene foto — sube otra para sustituirla.</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6">
            <p className={labelClass}>Opiniones de pacientes (hasta 3)</p>
            {[0, 1, 2].map((i) => {
              const opinion = Array.isArray(clinic.opiniones)
                ? (clinic.opiniones as { autor?: string; texto?: string }[])[i]
                : undefined;
              return (
                <div key={i} className="mt-2 rounded-lg border border-line bg-white p-3">
                  <input
                    name={`opinion_autor_${i}`}
                    placeholder="Nombre del paciente"
                    defaultValue={opinion?.autor ?? undefined}
                    className={inputClass}
                  />
                  <textarea
                    name={`opinion_texto_${i}`}
                    rows={2}
                    placeholder="Lo que dijo..."
                    defaultValue={opinion?.texto ?? undefined}
                    className={`${inputClass} mt-2`}
                  />
                </div>
              );
            })}
          </div>

          <div className="mt-6">
            <label htmlFor="certificados" className={labelClass}>
              Diplomas / certificados
            </label>
            {clinic.certificados.length > 0 && (
              <p className="mt-1 text-xs text-ink-soft">
                Ya tienes {clinic.certificados.length} subido(s). Lo que subas
                aquí se añade a esos, no los sustituye.
              </p>
            )}
            <input
              id="certificados"
              name="certificados"
              type="file"
              accept="image/*"
              multiple
              className="mt-2 block w-full text-sm text-ink-soft file:mr-3 file:rounded-lg file:border-0 file:bg-sage file:px-3 file:py-2 file:text-sm file:font-medium file:text-sage-ink"
            />
          </div>
        </section>

      <div className="flex items-center gap-3 border-t border-line pt-6">
        <button
          type="submit"
          disabled={estado !== "idle"}
          className="rounded-full bg-teal px-6 py-3 text-sm font-medium text-paper transition hover:bg-teal-dark disabled:opacity-60"
        >
          {estado === "comprimiendo"
            ? "Optimizando fotos…"
            : estado === "enviando"
              ? "Guardando…"
              : "Guardar cambios"}
        </button>
        {estado !== "idle" && (
          <span className="text-xs text-ink-soft">
            Puede tardar unos segundos si has subido varias fotos.
          </span>
        )}
      </div>
    </form>
  );
}
