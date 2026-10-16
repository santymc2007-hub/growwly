"use client";

import { SelectorCategoriaCentro } from "@/components/clinics/selector-categoria-centro";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  TECNICAS_POR_CATEGORIA,
  IDIOMAS_DISPONIBLES,
  ACCESIBILIDAD_OPCIONES,
  PRECIO_OPCIONES,
  formatearPrecio,
} from "@/lib/clinic-options";
import { getRawSocialValue } from "@/lib/social-links";
import type { Clinic } from "@/lib/supabase/database.types";
import { HorarioSemanal } from "@/components/clinica/horario-semanal";
import { UbicacionCascada } from "@/components/clinica/ubicacion-cascada";
import { FotosClinicaField } from "@/components/clinica/fotos-clinica-field";
import { CampoSlug } from "./campo-slug";
import { InterruptorVisibilidad } from "../visibilidad/interruptor-visibilidad";
import { TIPO_LABEL, type TipoVisibilidad } from "../visibilidad/tipos-visibilidad";
import { comprimirFormData } from "@/lib/comprimir-imagen";
import { OverlayCargando } from "@/components/ui/overlay-cargando";

// Las mismas 4 palancas que ve el admin en /admin/visibilidad — se
// reutilizan aquí para que activar/desactivar desde la ficha de la
// clínica sea literalmente la misma acción (mismo registro en el log,
// mismo email a la clínica), nunca un campo aparte que pueda
// desincronizarse.
const COLUMNAS_VISIBILIDAD: {
  tipo: TipoVisibilidad;
  activo: (c: Clinic) => boolean;
  solicitado: (c: Clinic) => boolean;
}[] = [
  { tipo: "destacado", activo: (c) => c.destacado, solicitado: (c) => c.destacado_solicitado },
  {
    tipo: "destacado_home",
    activo: (c) => c.destacado_home,
    solicitado: (c) => c.destacado_home_solicitado,
  },
  {
    tipo: "destacado_ciudad",
    activo: (c) => c.destacado_ciudad,
    solicitado: (c) => c.destacado_ciudad_solicitado,
  },
  {
    tipo: "premium",
    activo: (c) => c.plan === "premium",
    solicitado: (c) => Boolean(c.plan_solicitado),
  },
];

function fechasVisibilidad(clinic: Clinic) {
  const fechas = clinic.visibilidad_fechas;
  return fechas && typeof fechas === "object" && !Array.isArray(fechas)
    ? (fechas as Record<string, { expira_en: string | null; meses_solicitados?: number | null }>)
    : {};
}

type ClinicFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  clinic?: Clinic;
  error?: string;
  guardado?: boolean;
  municipios: { provincia: string; nombre: string }[];
  zonas: { municipio: string; nombre: string }[];
};

const inputClass =
  "mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-teal/30";
const labelClass = "text-sm font-medium text-ink";

const MAX_ANTES_DESPUES = 10;
const MAX_OPINIONES = 10;

export function ClinicForm({ action, clinic, error, guardado, municipios, zonas }: ClinicFormProps) {
  const [estado, setEstado] = useState<"idle" | "comprimiendo" | "enviando">("idle");
  const [errorEnvio, setErrorEnvio] = useState<string | null>(null);
  const avisoRef = useRef<HTMLDivElement>(null);
  const [numAntesDespues, setNumAntesDespues] = useState(() =>
    Math.min(
      MAX_ANTES_DESPUES,
      Math.max(3, Array.isArray(clinic?.fotos_antes_despues) ? clinic.fotos_antes_despues.length : 0),
    ),
  );
  const [numOpiniones, setNumOpiniones] = useState(() =>
    Math.min(
      MAX_OPINIONES,
      Math.max(3, Array.isArray(clinic?.opiniones) ? clinic.opiniones.length : 0),
    ),
  );

  // Al guardar nos quedamos en la misma ficha (ver actions.ts), así que
  // el navegador no hace un scroll-to-top automático de navegación — si
  // el admin estaba abajo del todo rellenando datos, el aviso de
  // guardado (o de error) queda fuera de la vista y parece que no ha
  // pasado nada.
  useEffect(() => {
    if (guardado || error || errorEnvio) {
      avisoRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [guardado, error, errorEnvio]);

  // Sin esto, una foto o un logo subidos directos desde el móvil (a
  // veces 5-10MB sin comprimir) pueden hacer que la Server Action tarde
  // más de la cuenta y la función se corte a medias — el admin solo veía
  // una pantalla de error genérica sin ninguna pista. Se comprimen en el
  // propio navegador antes de enviar, igual que ya hace el panel de
  // autoservicio de la clínica (ver ficha-clinica-form.tsx).
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setEstado("comprimiendo");
    setErrorEnvio(null);
    try {
      const original = new FormData(e.currentTarget);
      const comprimido = await comprimirFormData(original);
      setEstado("enviando");

      // Si la action termina bien, hace redirect() y el navegador navega
      // fuera de esta página — este componente se desmonta antes de que
      // el código siga. Si tarda demasiado (conexión lenta, función
      // colgada en el servidor) avisamos en vez de dejar el overlay
      // puesto para siempre sin ninguna pista.
      let avisoLento = false;
      const avisoTimeout = setTimeout(() => {
        avisoLento = true;
        // Quitamos el overlay para que este aviso se vea — si no, se
        // queda tapado detrás de "Guardando los cambios…" para siempre.
        setEstado("idle");
        setErrorEnvio(
          "Esto está tardando más de lo normal. Puede que siga en marcha de fondo — espera un poco y recarga la página para comprobar si el cambio se guardó, o inténtalo de nuevo.",
        );
      }, 20000);

      try {
        await action(comprimido);
      } catch (err) {
        // redirect() en la Server Action (p. ej. al guardar con éxito,
        // que ahora nos deja en la misma ficha) se implementa lanzando un
        // error especial con digest "NEXT_REDIRECT" — si nos quedamos en
        // la misma página no se desmonta el componente como antes, así
        // que este catch lo veía pasar y lo mostraba como si fuera un
        // fallo real. Hay que dejarlo seguir para que Next.js complete
        // la navegación, igual que hace ficha-clinica-form.tsx al no
        // capturarlo en absoluto.
        const digest =
          err && typeof err === "object" && "digest" in err
            ? String((err as { digest?: unknown }).digest)
            : null;
        if (digest?.startsWith("NEXT_REDIRECT")) {
          throw err;
        }
        if (!avisoLento) {
          const base =
            err instanceof Error
              ? err.message
              : "No se ha podido guardar. Inténtalo de nuevo.";
          setErrorEnvio(digest ? `${base} (código: ${digest})` : base);
        }
      } finally {
        clearTimeout(avisoTimeout);
      }
    } finally {
      setEstado("idle");
    }
  }

  return (
    <form onSubmit={onSubmit} className="max-w-2xl">
      {estado !== "idle" && (
        <OverlayCargando
          mensaje={
            estado === "comprimiendo"
              ? "Optimizando las fotos…"
              : "Guardando los cambios…"
          }
        />
      )}
      <div ref={avisoRef}>
        {guardado && !errorEnvio && (
          <p className="mb-6 rounded-lg bg-teal/10 px-4 py-3 text-sm text-teal-dark">
            Cambios guardados correctamente.
          </p>
        )}
        {errorEnvio && (
          <p className="mb-6 rounded-lg bg-error/10 px-4 py-3 text-sm text-error-dark">
            {errorEnvio}
          </p>
        )}
        {error && (
          <p className="mb-6 rounded-lg bg-error/10 px-4 py-3 text-sm text-error-dark">
            {decodeURIComponent(error)}
          </p>
        )}
      </div>

      <section>
        <h2 className="font-display text-lg text-teal-dark">Datos básicos</h2>
        <div className="mt-4 grid gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-[138px_1fr] sm:items-start">
            <div>
              <label className={labelClass} htmlFor="logo">
                Logo
              </label>
              <p className="mt-0.5 text-xs text-ink-soft">138×58px, apaisado</p>
              {clinic?.logo_url && (
                <div className="relative mt-2 h-[58px] w-[138px] overflow-hidden rounded-lg border border-line bg-white p-1.5">
                  <Image src={clinic.logo_url} alt="" fill sizes="138px" className="object-contain" />
                </div>
              )}
              <input
                id="logo"
                name="logo"
                type="file"
                accept="image/*"
                className="mt-2 block w-full text-xs text-ink-soft file:mr-2 file:rounded-lg file:border-0 file:bg-sage file:px-2 file:py-1.5 file:text-xs file:font-medium file:text-sage-ink"
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="nombre">
                Nombre *
              </label>
              <input
                id="nombre"
                name="nombre"
                required
                defaultValue={clinic?.nombre}
                className={inputClass}
              />
            </div>
          </div>
          <CampoSlug slugInicial={clinic?.slug} />
          <div>
            <label className={labelClass} htmlFor="descripcion">
              Descripción
            </label>
            <textarea
              id="descripcion"
              name="descripcion"
              rows={3}
              defaultValue={clinic?.descripcion ?? undefined}
              className={inputClass}
            />
          </div>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="font-display text-lg text-teal-dark">Fotos</h2>
        <p className="mt-1 text-xs text-ink-soft">
          La primera es la que se usa como foto principal en los listados —
          arrastra las fotos (o usa ‹ ›) para cambiar el orden.
        </p>

        {clinic && <input type="hidden" name="slug_actual" value={clinic.slug} />}
        {clinic && (
          <input
            type="hidden"
            name="slugs_antiguos_actual"
            value={JSON.stringify(clinic.slugs_antiguos)}
          />
        )}

        <FotosClinicaField fotosIniciales={clinic?.fotos ?? []} max={10} />
      </section>

      <section className="mt-8">
        <h2 className="font-display text-lg text-teal-dark">Ubicación</h2>
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className={labelClass} htmlFor="direccion">
              Dirección
            </label>
            <input
              id="direccion"
              name="direccion"
              defaultValue={clinic?.direccion ?? undefined}
              className={inputClass}
            />
          </div>
          <div className="sm:col-span-3">
            <UbicacionCascada
              municipios={municipios}
              zonas={zonas}
              provinciaInicial={clinic?.provincia}
              ciudadInicial={clinic?.ciudad}
              zonaInicial={clinic?.zona}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="lat">
              Latitud
            </label>
            <input
              id="lat"
              name="lat"
              type="number"
              step="any"
              defaultValue={clinic?.lat ?? undefined}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="lng">
              Longitud
            </label>
            <input
              id="lng"
              name="lng"
              type="number"
              step="any"
              defaultValue={clinic?.lng ?? undefined}
              className={inputClass}
            />
          </div>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="font-display text-lg text-teal-dark">Contacto</h2>
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass} htmlFor="telefono">
              Teléfono
            </label>
            <input
              id="telefono"
              name="telefono"
              defaultValue={clinic?.telefono ?? undefined}
              className={inputClass}
            />
            <label className="mt-1.5 flex items-center gap-2 text-xs text-ink-soft">
              <input
                type="checkbox"
                name="telefono_es_movil"
                defaultChecked={clinic ? clinic.telefono_es_movil : true}
              />
              Es un móvil (recibe WhatsApp)
            </label>
          </div>
          <div>
            <label className={labelClass} htmlFor="email">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              defaultValue={clinic?.email ?? undefined}
              className={inputClass}
            />
          </div>
          <div className="col-span-2">
            <label className={labelClass} htmlFor="web">
              Sitio web
            </label>
            <input
              id="web"
              name="web"
              type="url"
              placeholder="https://"
              defaultValue={clinic?.web ?? undefined}
              className={inputClass}
            />
          </div>
          <div className="col-span-2">
            <label className={labelClass} htmlFor="registro_sanitario">
              Nº de registro sanitario
            </label>
            <input
              id="registro_sanitario"
              name="registro_sanitario"
              placeholder="Autorización del registro de centros sanitarios"
              defaultValue={clinic?.registro_sanitario ?? undefined}
              className={inputClass}
            />
          </div>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="font-display text-lg text-teal-dark">Otros datos</h2>
        <div className="mt-4 grid gap-4">
          <div>
            <label className={labelClass}>Rango de precios (solo injerto capilar)</label>
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
                  defaultValue={clinic?.precio_desde ?? ""}
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
                  defaultValue={clinic?.precio_hasta ?? ""}
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
              Notas de precio{" "}
              <span className="text-xs text-ink-soft">
                (opcional — para casos que no encajan en un rango simple, ej.
                &quot;precio por sesión&quot;)
              </span>
            </label>
            <input
              id="rango_precios"
              name="rango_precios"
              defaultValue={clinic?.rango_precios ?? undefined}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Horario</label>
            <div className="mt-1 rounded-lg border border-line bg-white p-3">
              <HorarioSemanal valorInicial={clinic?.horarios_estructurados} />
            </div>
          </div>
          <div>
            <p className={labelClass}>Accesibilidad</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {ACCESIBILIDAD_OPCIONES.map(({ clave, etiqueta }) => (
                <label
                  key={clave}
                  className="flex items-center gap-1.5 rounded-full border border-line bg-white px-3 py-1.5 text-sm"
                >
                  <input
                    type="checkbox"
                    name="accesibilidad_checks"
                    value={clave}
                    defaultChecked={clinic?.accesibilidad_checks?.includes(clave)}
                  />
                  {etiqueta}
                </label>
              ))}
            </div>
            <label className="mt-3 block text-xs text-ink-soft" htmlFor="accesibilidad">
              Notas adicionales de accesibilidad (opcional)
            </label>
            <input
              id="accesibilidad"
              name="accesibilidad"
              placeholder="Ej. Ascensor de 90cm, plaza de aparcamiento reservada..."
              defaultValue={clinic?.accesibilidad ?? undefined}
              className={`${inputClass} mt-1`}
            />
          </div>
          <SelectorCategoriaCentro valorInicial={clinic?.tipo_negocio} />
          <div>
            <label className={labelClass} htmlFor="servicios_adicionales">
              Otros servicios (separados por coma)
            </label>
            <input
              id="servicios_adicionales"
              name="servicios_adicionales"
              placeholder="Ej. Medicina estética facial, Cirugía plástica"
              defaultValue={clinic?.servicios_adicionales?.join(", ") ?? undefined}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="detalle_oferta">
              Oferta activa (déjalo vacío si no tiene){" "}
              <span className="ml-1 rounded-full bg-cyan/15 px-2 py-0.5 text-[11px] font-semibold text-cyan-dark">
                Solo Perfil ampliado
              </span>
            </label>
            <p className="mt-0.5 text-xs text-ink-soft">
              Se guarda aunque la clínica sea plan básico, pero solo se muestra
              en la ficha pública si tiene Perfil ampliado.
            </p>
            <input
              id="detalle_oferta"
              name="detalle_oferta"
              placeholder="Ej. 20% de descuento en primera sesión"
              defaultValue={clinic?.detalle_oferta ?? undefined}
              className={inputClass}
            />
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {clinic && (clinic.rating_google != null || clinic.resenas_google != null) && (
            <div className="col-span-2">
              <p className={labelClass}>Nota y reseñas Google</p>
              <p className="mt-1 text-sm text-ink-soft">
                {clinic.rating_google != null ? `★ ${clinic.rating_google}` : "Sin nota"}
                {clinic.resenas_google != null ? ` · ${clinic.resenas_google} reseñas` : ""}
                <span className="ml-1 text-xs">
                  (se sincroniza solo cada semana desde Google Maps, no editable
                  aquí)
                </span>
              </p>
            </div>
          )}
          <div>
            <label className={labelClass} htmlFor="rating_doctoralia">
              Nota Doctoralia
            </label>
            <input
              id="rating_doctoralia"
              name="rating_doctoralia"
              type="number"
              step="0.1"
              min="0"
              max="5"
              defaultValue={clinic?.rating_doctoralia ?? undefined}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="resenas_doctoralia">
              Reseñas Doctoralia
            </label>
            <input
              id="resenas_doctoralia"
              name="resenas_doctoralia"
              type="number"
              min="0"
              defaultValue={clinic?.resenas_doctoralia ?? undefined}
              className={inputClass}
            />
          </div>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="font-display text-lg text-teal-dark">
          Redes sociales
        </h2>
        <p className="mt-1 text-xs text-ink-soft">
          Solo el usuario/handle, sin la URL completa (ej. &quot;raizcapilarmadrid&quot;).
        </p>
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <label className={labelClass} htmlFor="red_instagram">
              Instagram
            </label>
            <input
              id="red_instagram"
              name="red_instagram"
              defaultValue={getRawSocialValue(
                clinic?.redes_sociales ?? null,
                "instagram",
              )}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="red_facebook">
              Facebook
            </label>
            <input
              id="red_facebook"
              name="red_facebook"
              defaultValue={getRawSocialValue(
                clinic?.redes_sociales ?? null,
                "facebook",
              )}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="red_tiktok">
              TikTok
            </label>
            <input
              id="red_tiktok"
              name="red_tiktok"
              defaultValue={getRawSocialValue(
                clinic?.redes_sociales ?? null,
                "tiktok",
              )}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="red_linkedin">
              LinkedIn
            </label>
            <input
              id="red_linkedin"
              name="red_linkedin"
              placeholder="company/nombre-clinica"
              defaultValue={getRawSocialValue(
                clinic?.redes_sociales ?? null,
                "linkedin",
              )}
              className={inputClass}
            />
          </div>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="font-display text-lg text-teal-dark">Técnicas</h2>
        {Object.entries(TECNICAS_POR_CATEGORIA).map(([categoria, tecnicas]) => (
          <div key={categoria} className="mt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft/70">
              {categoria}
            </p>
            <div className="mt-1.5 flex flex-wrap gap-x-6 gap-y-2">
              {tecnicas.map((tecnica) => (
                <label key={tecnica} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    name="tecnicas"
                    value={tecnica}
                    defaultChecked={clinic?.tecnicas.includes(tecnica)}
                  />
                  {tecnica}
                </label>
              ))}
            </div>
          </div>
        ))}
      </section>

      <section className="mt-8">
        <h2 className="font-display text-lg text-teal-dark">Idiomas</h2>
        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
          {IDIOMAS_DISPONIBLES.map((idioma) => (
            <label key={idioma} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="idiomas"
                value={idioma}
                defaultChecked={clinic?.idiomas.includes(idioma)}
              />
              {idioma}
            </label>
          ))}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="font-display text-lg text-teal-dark">
          Perfil ampliado (contenido)
        </h2>
        <p className="mt-1 text-xs text-ink-soft">
          Se guarda aunque el plan sea Básico — solo se muestra en la ficha
          pública si la clínica tiene Perfil ampliado activo (ver
          Visibilidad más abajo).
        </p>

        <div className="mt-4">
          <label htmlFor="descripcion_extendida" className={labelClass}>
            Descripción extendida
          </label>
          <p className="mt-0.5 text-xs text-ink-soft">
            Admite formato Markdown (títulos con #, negrita con **texto**).
          </p>
          <textarea
            id="descripcion_extendida"
            name="descripcion_extendida"
            rows={5}
            defaultValue={clinic?.descripcion_extendida ?? undefined}
            className={`${inputClass} mt-2`}
          />
        </div>

        <div className="mt-4">
          <label htmlFor="video_url" className={labelClass}>
            Vídeo (YouTube o Vimeo)
          </label>
          <input
            id="video_url"
            name="video_url"
            type="url"
            placeholder="https://www.youtube.com/watch?v=..."
            defaultValue={clinic?.video_url ?? undefined}
            className={inputClass}
          />
        </div>

        <div className="mt-4">
          <label htmlFor="reserva_online_url" className={labelClass}>
            Reserva de cita online
          </label>
          <p className="mt-0.5 text-xs text-ink-soft">
            Enlace externo a su sistema de reservas (Calendly, su propia
            web...). Si se rellena, aparece un botón en la ficha.
          </p>
          <input
            id="reserva_online_url"
            name="reserva_online_url"
            type="url"
            placeholder="https://..."
            defaultValue={clinic?.reserva_online_url ?? undefined}
            className={`${inputClass} mt-1`}
          />
        </div>

        <div className="mt-6">
          <p className={labelClass}>Equipo médico (hasta 3)</p>
          {[0, 1, 2].map((i) => {
            const medico = Array.isArray(clinic?.medicos)
              ? (clinic.medicos as { nombre?: string; especialidad?: string; linkedin?: string; colegiado?: string }[])[i]
              : undefined;
            return (
              <div key={i} className="mt-2 rounded-lg border border-line p-2.5">
                <div className="grid grid-cols-2 gap-2">
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
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <input
                    name={`medico_colegiado_${i}`}
                    placeholder="Nº de colegiado (médicos)"
                    defaultValue={medico?.colegiado ?? undefined}
                    className={inputClass}
                  />
                  <input
                    name={`medico_linkedin_${i}`}
                    type="url"
                    placeholder="Perfil de LinkedIn (opcional)"
                    defaultValue={medico?.linkedin ?? undefined}
                    className={inputClass}
                  />
                </div>
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
            const par = Array.isArray(clinic?.fotos_antes_despues)
              ? (
                  clinic.fotos_antes_despues as {
                    antes?: string;
                    despues?: string;
                    descripcion?: string;
                  }[]
                )[i]
              : undefined;
            return (
              <div key={i} className="mt-2 rounded-lg border border-line p-2.5">
                <div className="grid grid-cols-2 gap-3">
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
                <input
                  name={`antes_despues_descripcion_${i}`}
                  placeholder="Breve descripción del caso (opcional)"
                  defaultValue={par?.descripcion ?? undefined}
                  className={`${inputClass} mt-2`}
                />
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
            <span className="font-normal text-ink-soft">(hasta {MAX_OPINIONES})</span>
          </p>
          {Array.from({ length: numOpiniones }, (_, i) => i).map((i) => {
            const opinion = Array.isArray(clinic?.opiniones)
              ? (clinic.opiniones as { autor?: string; texto?: string; puntuacion?: number }[])[i]
              : undefined;
            return (
              <div key={i} className="mt-2 rounded-lg border border-line bg-white p-3">
                <div className="flex flex-wrap items-center gap-3">
                  <input
                    name={`opinion_autor_${i}`}
                    placeholder="Nombre del paciente"
                    defaultValue={opinion?.autor ?? undefined}
                    className={`${inputClass} mt-0 flex-1`}
                  />
                  <label className="flex items-center gap-2 text-sm text-ink-soft">
                    Puntuación
                    <select
                      name={`opinion_puntuacion_${i}`}
                      defaultValue={opinion?.puntuacion ?? 5}
                      className="rounded-lg border border-line bg-white px-2 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-teal/30"
                    >
                      {[5, 4, 3, 2, 1].map((n) => (
                        <option key={n} value={n}>
                          {"★".repeat(n)}
                          {"☆".repeat(5 - n)}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
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
          {clinic && clinic.certificados.length > 0 && (
            <p className="mt-1 text-xs text-ink-soft">
              Ya tiene {clinic.certificados.length} subido(s). Lo que subas
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

      <section className="mt-8 flex flex-col gap-3">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="primera_consulta_gratis"
            defaultChecked={clinic?.primera_consulta_gratis}
          />
          Primera consulta gratis
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="financiacion"
            defaultChecked={clinic?.financiacion}
          />
          Ofrece financiación
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="acepta_videoconsulta"
            defaultChecked={clinic?.acepta_videoconsulta}
          />
          Aceptamos videoconsulta
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="verificado"
            defaultChecked={clinic?.verificado}
          />
          Verificada por Growwly{" "}
          <span className="text-xs text-ink-soft">(solo uso interno)</span>
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="publicado"
            defaultChecked={clinic?.publicado ?? true}
          />
          Publicada{" "}
          <span className="text-xs text-ink-soft">
            (visible en el directorio — la propia clínica también puede
            desactivarlo desde su panel)
          </span>
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="verificado_admin"
            defaultChecked={clinic?.verificado_admin ?? true}
          />
          Autenticidad verificada por admin{" "}
          <span className="text-xs text-ink-soft">
            (control exclusivo de admin, por encima de &quot;Publicada&quot;:
            sin esto marcado la ficha no se ve en la web pase lo que pase con
            el interruptor de la propia clínica — así puedes pausarla en
            cualquier momento, por ejemplo por impago. Se desmarca solo al
            crearse una clínica nueva desde /clinica/registro, hasta que
            confirmes que es quien dice ser)
          </span>
        </label>
        <div className="mt-6 rounded-xl border border-line bg-paper-dim/60 p-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="font-display text-base text-teal-dark">
              Visibilidad
            </h3>
            <Link
              href="/admin/visibilidad"
              className="text-xs font-medium text-cyan hover:text-cyan-dark"
            >
              Ver histórico completo →
            </Link>
          </div>
          <p className="mt-1 text-xs text-ink-soft">
            Estos interruptores son los mismos que en Visibilidad: activar o
            desactivar aquí queda registrado con fecha y, si la clínica tiene
            email, le avisa — así nunca se desincroniza con lo que ves en esa
            sección.
          </p>

          {clinic ? (
            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {COLUMNAS_VISIBILIDAD.map((col) => {
                const estado = col.solicitado(clinic)
                  ? "solicitado"
                  : col.activo(clinic)
                    ? "activo"
                    : "inactivo";
                const fechas = fechasVisibilidad(clinic);
                return (
                  <div key={col.tipo}>
                    <p className="text-xs font-medium text-ink-soft">
                      {TIPO_LABEL[col.tipo]}
                    </p>
                    <div className="mt-1.5">
                      <InterruptorVisibilidad
                        clinicId={clinic.id}
                        tipo={col.tipo}
                        estado={estado}
                        expiraEn={fechas[col.tipo]?.expira_en ?? null}
                        mesesSolicitados={
                          estado === "solicitado"
                            ? fechas[col.tipo]?.meses_solicitados
                            : undefined
                        }
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="mt-4 text-sm text-ink-soft">
              Disponible en cuanto crees la clínica — entra a Editar para
              activar destacados o Perfil ampliado.
            </p>
          )}

          <label className="mt-5 flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="leads_enabled"
              defaultChecked={clinic?.leads_enabled ?? false}
            />
            Acceso a leads de cortesía (aunque sea plan básico){" "}
            <span className="text-xs text-ink-soft">
              (prueba gratuita — en premium no hace falta, ya recibe leads)
            </span>
          </label>
        </div>
      </section>

      <div className="mt-10 flex gap-3">
        <button
          type="submit"
          className="rounded-lg bg-teal px-5 py-2.5 text-sm font-medium text-paper hover:bg-teal-dark"
        >
          {clinic ? "Guardar cambios" : "Crear clínica"}
        </button>
      </div>
    </form>
  );
}
