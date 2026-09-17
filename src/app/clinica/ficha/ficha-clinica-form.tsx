"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Sparkles, Lock, Check } from "lucide-react";
import {
  TECNICAS_POR_CATEGORIA,
  IDIOMAS_DISPONIBLES,
  PRECIO_OPCIONES,
  TIPOS_NEGOCIO,
  formatearPrecio,
} from "@/lib/clinic-options";
import { getRawSocialValue } from "@/lib/social-links";
import type { Clinic } from "@/lib/supabase/database.types";
import { HorarioSemanal } from "@/components/clinica/horario-semanal";
import { UbicacionCascada } from "@/components/clinica/ubicacion-cascada";
import { FotosClinicaField } from "@/components/clinica/fotos-clinica-field";
import { comprimirFormData } from "@/lib/comprimir-imagen";
import { OverlayCargando } from "@/components/ui/overlay-cargando";

type Props = {
  clinic: Clinic;
  nombreGestor: string | null;
  action: (formData: FormData) => void;
  municipios: { provincia: string; nombre: string }[];
  zonas: { municipio: string; nombre: string }[];
};

const inputClass =
  "mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-teal/30";
const labelClass = "text-sm font-medium text-ink";

const MAX_ANTES_DESPUES = 10;
const MAX_OPINIONES = 10;

export function FichaClinicaForm({
  clinic,
  nombreGestor,
  action,
  municipios,
  zonas,
}: Props) {
  const [estado, setEstado] = useState<"idle" | "comprimiendo" | "enviando">("idle");
  const [numAntesDespues, setNumAntesDespues] = useState(() =>
    Math.min(
      MAX_ANTES_DESPUES,
      Math.max(3, Array.isArray(clinic.fotos_antes_despues) ? clinic.fotos_antes_despues.length : 0),
    ),
  );
  const [numOpiniones, setNumOpiniones] = useState(() =>
    Math.min(
      MAX_OPINIONES,
      Math.max(3, Array.isArray(clinic.opiniones) ? clinic.opiniones.length : 0),
    ),
  );

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
      {estado !== "idle" && (
        <OverlayCargando
          mensaje={
            estado === "comprimiendo"
              ? "Optimizando tus fotos…"
              : "Guardando los cambios en tu ficha…"
          }
        />
      )}

      <section className="rounded-2xl border border-line bg-white p-5">
        <h2 className="border-b border-line pb-2 font-display text-lg text-teal-dark">Perfil Básico</h2>
        <div className="mt-4 grid gap-4">
          <div>
            <label htmlFor="nombre_gestor" className={labelClass}>
              Tu nombre{" "}
              <span className="font-normal text-ink-soft">
                (la persona que gestiona esta cuenta — sale en el saludo de la
                cabecera)
              </span>
            </label>
            <input
              id="nombre_gestor"
              name="nombre_gestor"
              placeholder="Ej. María García"
              defaultValue={nombreGestor ?? undefined}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="logo" className={labelClass}>
              Logo de la clínica
            </label>
            <p className="mt-0.5 text-xs text-ink-soft">
              Se mostrará a 120×50px — sube una imagen apaisada (no
              cuadrada) para que no se vea diminuta ni recortada.
            </p>
            {clinic.logo_url && (
              <div className="relative mt-2 h-[50px] w-[120px] overflow-hidden rounded-lg border border-line bg-white p-1.5">
                <Image src={clinic.logo_url} alt="" fill sizes="120px" className="object-contain" />
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
              <span className="font-normal text-ink-soft">(hasta 10)</span>
            </label>
            <p className="mt-0.5 text-xs text-ink-soft">
              La primera es la que se usa como foto principal en los
              listados — arrastra las fotos (o usa ‹ ›) para cambiar el
              orden.
            </p>
            <FotosClinicaField fotosIniciales={clinic.fotos} max={10} />
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
          <div>
            <UbicacionCascada
              municipios={municipios}
              zonas={zonas}
              provinciaInicial={clinic.provincia}
              ciudadInicial={clinic.ciudad}
              zonaInicial={clinic.zona}
            />
          </div>
        </div>
      </section>

      <section>
        <h2 className="border-b border-line pb-2 font-display text-lg text-teal-dark">
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
        <h2 className="border-b border-line pb-2 font-display text-lg text-teal-dark">
          Técnicas e idiomas
        </h2>
        <div className="mt-4">
          <p className={labelClass}>Técnicas que ofrecéis</p>
          {Object.entries(TECNICAS_POR_CATEGORIA).map(([categoria, tecnicas]) => (
            <div key={categoria} className="mt-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft/70">
                {categoria}
              </p>
              <div className="mt-1.5 flex flex-wrap gap-2">
                {tecnicas.map((t) => (
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
          ))}
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
        <h2 className="border-b border-line pb-2 font-display text-lg text-teal-dark">
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
              placeholder="Ej. Acceso sin escalones, ascensor, aseo adaptado"
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
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="acepta_videoconsulta"
              defaultChecked={clinic.acepta_videoconsulta}
            />
            Aceptamos videoconsulta
          </label>
        </div>
      </section>

      {clinic.plan !== "premium" && (
        <div className="rounded-3xl bg-gradient-to-r from-brand-green to-brand-blue p-6 shadow-lg shadow-teal/10 sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-5">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-1 text-xs font-bold uppercase tracking-wide text-teal-dark">
                <Sparkles className="h-3.5 w-3.5" aria-hidden />
                Perfil detallado
              </div>
              <p className="mt-2 font-display text-xl font-extrabold text-teal-dark sm:text-2xl">
                Es lo que más convierte visitas en clientes
              </p>
              <ul className="mt-3 flex flex-col gap-1.5 text-sm font-medium text-teal-dark/90">
                {[
                  "Fotos antes/después y opiniones de pacientes reales",
                  "Ofertas",
                  "Nombres del equipo y su especialidad — da seriedad y rigor",
                  "Link a reserva de cita online, si ya tienes uno",
                  "Vídeo de la clínica — mejora el awareness de tu marca",
                  "Diplomas y certificados",
                ].map((beneficio) => (
                  <li key={beneficio} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                    {beneficio}
                  </li>
                ))}
              </ul>
            </div>
            <Link
              href="/clinica/visibilidad"
              className="press whitespace-nowrap rounded-full bg-white px-6 py-3 text-sm font-bold text-teal-dark shadow-md transition hover:opacity-90"
            >
              Solicitar Perfil detallado →
            </Link>
          </div>
        </div>
      )}

      <section
        className={`mt-2 rounded-xl border p-4 ${
          clinic.plan === "premium"
            ? "border-cyan/30 bg-cyan/5"
            : "border-line bg-paper-dim/60"
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-2">
          <h2 className="font-display text-lg text-teal-dark">
            Contenido de Perfil detallado
          </h2>
          {clinic.plan !== "premium" && (
            <span className="flex items-center gap-1.5 rounded-full bg-ink-soft/10 px-3 py-1 text-xs font-bold text-ink-soft">
              <Lock className="h-3.5 w-3.5" aria-hidden />
              No visible en tu ficha pública
            </span>
          )}
        </div>
        {clinic.plan === "premium" ? (
          <p className="mt-1 text-sm text-ink-soft">
            Visible en tu ficha pública.
          </p>
        ) : (
          <p className="mt-1 text-sm text-ink-soft">
            Puedes rellenarlo ya — se guarda todo, listo para publicarse en
            el momento en que actives el Perfil detallado.{" "}
            <Link href="/clinica/visibilidad" className="font-bold text-cyan-dark hover:underline">
              Solicitar Perfil detallado →
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
            <label htmlFor="reserva_online_url" className={labelClass}>
              Reserva tu cita online
            </label>
            <p className="mt-0.5 text-xs text-ink-soft">
              Enlace externo a tu sistema de reservas (Calendly, tu propia
              web...). Si lo rellenas, aparecerá un botón en tu ficha.
            </p>
            <input
              id="reserva_online_url"
              name="reserva_online_url"
              type="url"
              placeholder="https://..."
              defaultValue={clinic.reserva_online_url ?? undefined}
              className={`${inputClass} mt-2`}
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
            <p className={labelClass}>
              Fotos antes / después{" "}
              <span className="font-normal text-ink-soft">
                (hasta {MAX_ANTES_DESPUES} pares)
              </span>
            </p>
            {Array.from({ length: numAntesDespues }, (_, i) => i).map((i) => {
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
            {numAntesDespues < MAX_ANTES_DESPUES && (
              <button
                type="button"
                onClick={() => setNumAntesDespues((n) => Math.min(MAX_ANTES_DESPUES, n + 1))}
                className="press mt-2 text-sm font-medium text-cyan-dark hover:underline"
              >
                + Añadir más fotos
              </button>
            )}
          </div>

          <div className="mt-6">
            <p className={labelClass}>
              Opiniones de pacientes{" "}
              <span className="font-normal text-ink-soft">
                (hasta {MAX_OPINIONES})
              </span>
            </p>
            {Array.from({ length: numOpiniones }, (_, i) => i).map((i) => {
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
            {numOpiniones < MAX_OPINIONES && (
              <button
                type="button"
                onClick={() => setNumOpiniones((n) => Math.min(MAX_OPINIONES, n + 1))}
                className="press mt-2 text-sm font-medium text-cyan-dark hover:underline"
              >
                + Añadir más opiniones
              </button>
            )}
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

          {clinic.plan !== "premium" && (
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-teal-dark px-5 py-4">
              <p className="text-sm font-medium text-paper">
                Todo esto ya está guardado — actívalo para que lo vean tus
                pacientes.
              </p>
              <Link
                href="/clinica/visibilidad"
                className="press whitespace-nowrap rounded-full bg-white px-5 py-2.5 text-sm font-bold text-teal-dark shadow transition hover:opacity-90"
              >
                Solicitar Perfil detallado →
              </Link>
            </div>
          )}
        </section>

      <div className="flex items-center gap-3 border-t border-line pt-6">
        <button
          type="submit"
          disabled={estado !== "idle"}
          className="press rounded-full bg-teal px-6 py-3 text-sm font-medium text-paper transition hover:bg-teal-dark disabled:opacity-60"
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
