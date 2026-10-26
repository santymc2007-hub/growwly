import Image from "next/image";
import { CamposSeo } from "@/components/admin/campos-seo";
import type { Tratamiento } from "@/lib/supabase/database.types";
import { TECNICAS_DISPONIBLES, CATEGORIAS_TRATAMIENTO } from "@/lib/clinic-options";
import { CampoMetaDescripcion } from "@/components/admin/campo-meta-description";
import { EditorContenido } from "@/components/admin/editor-contenido";
import { INFO_NIVEL, MAX_FUENTES, NIVELES_EVIDENCIA, leerFuentes } from "@/lib/tratamientos/evidencia";

type Props = {
  action: (formData: FormData) => void;
  tratamiento?: Tratamiento;
  error?: string;
};

const inputClass =
  "mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-teal/30";
const labelClass = "text-sm font-medium text-ink";
const MAX_FAQS = 6;

export function TratamientoForm({ action, tratamiento, error }: Props) {
  const faqs = Array.isArray(tratamiento?.preguntas_frecuentes)
    ? (tratamiento.preguntas_frecuentes as { pregunta?: string; respuesta?: string }[])
    : [];

  return (
    <form action={action} className="max-w-2xl">
      {error && (
        <p className="mb-6 rounded-lg bg-error/10 px-4 py-3 text-sm text-error-dark">
          {decodeURIComponent(error)}
        </p>
      )}

      <div className="flex flex-col gap-4">
        <div>
          <label className={labelClass} htmlFor="nombre">
            Nombre <span className="text-xs text-ink-soft">(H1 de la página y título en buscadores)</span>
          </label>
          <input
            id="nombre"
            name="nombre"
            required
            defaultValue={tratamiento?.nombre ?? undefined}
            className={inputClass}
          />
        </div>

        <CamposSeo
          base="/tratamientos"
          slugActual={tratamiento?.slug}
          seoTitleActual={tratamiento?.seo_title}
          placeholderTitle="Vacío = «{Tratamiento}: qué es, precio y clínicas»"
        />

        <div>
          <label className={labelClass} htmlFor="categoria">
            Categoría
          </label>
          <select
            id="categoria"
            name="categoria"
            defaultValue={tratamiento?.categoria ?? ""}
            className={inputClass}
          >
            <option value="">Sin categoría</option>
            {CATEGORIAS_TRATAMIENTO.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass} htmlFor="tecnica_relacionada">
            Técnica relacionada{" "}
            <span className="text-xs text-ink-soft">
              (debe coincidir exacto con una técnica de las clínicas, para
              poder mostrar precios y clínicas reales)
            </span>
          </label>
          <select
            id="tecnica_relacionada"
            name="tecnica_relacionada"
            defaultValue={tratamiento?.tecnica_relacionada ?? ""}
            className={inputClass}
          >
            <option value="">Sin vincular</option>
            {TECNICAS_DISPONIBLES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <CampoMetaDescripcion
          id="resumen"
          name="resumen"
          label="Resumen (meta description — aparece en el listado y en buscadores)"
          defaultValue={tratamiento?.resumen}
        />

        <div>
          <label className={labelClass} htmlFor="duracion_orientativa">
            Duración orientativa
          </label>
          <input
            id="duracion_orientativa"
            name="duracion_orientativa"
            placeholder="Ej. 4-8 horas, en 1 sesión"
            defaultValue={tratamiento?.duracion_orientativa ?? undefined}
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass} htmlFor="imagen_portada">
            Imagen de portada
          </label>
          {tratamiento?.imagen_portada && (
            <div className="relative mb-2 h-40 w-full overflow-hidden rounded-lg border border-line">
              <Image
                src={tratamiento.imagen_portada}
                alt=""
                fill
                sizes="600px"
                className="object-cover"
              />
            </div>
          )}
          <input
            id="imagen_portada"
            name="imagen_portada"
            type="file"
            accept="image/*"
            className="mt-1 block w-full text-sm text-ink-soft file:mr-3 file:rounded-lg file:border-0 file:bg-sage file:px-3 file:py-2 file:text-sm file:font-medium file:text-sage-ink"
          />
        </div>

        <div>
          <label className={labelClass} htmlFor="contenido">
            Contenido{" "}
            <span className="text-xs text-ink-soft">
              (qué es, para quién, proceso, recuperación)
            </span>
          </label>
          <div className="mt-1">
            <EditorContenido name="contenido" defaultValue={tratamiento?.contenido} />
          </div>
        </div>

        <div>
          <p className={labelClass}>
            Preguntas frecuentes{" "}
            <span className="text-xs text-ink-soft">
              (bloque FAQ — hasta {MAX_FAQS}; se marca para Google como datos
              estructurados, ayuda a salir en resultados enriquecidos)
            </span>
          </p>
          {Array.from({ length: MAX_FAQS }, (_, i) => (
            <div key={i} className="mt-2 rounded-lg border border-line bg-white p-3">
              <input
                name={`faq_pregunta_${i}`}
                placeholder="Pregunta"
                defaultValue={faqs[i]?.pregunta ?? undefined}
                className={inputClass}
              />
              <textarea
                name={`faq_respuesta_${i}`}
                rows={2}
                placeholder="Respuesta"
                defaultValue={faqs[i]?.respuesta ?? undefined}
                className={`${inputClass} mt-2`}
              />
            </div>
          ))}
        </div>

        <fieldset className="rounded-xl border border-teal/30 bg-sage/30 p-4">
          <legend className="px-1 text-sm font-semibold text-teal-dark">
            Evidencia científica frente a la alopecia
          </legend>
          <p className="mb-3 text-xs text-ink-soft">
            Se muestra en la ficha solo si marcas «Revisado» y hay al menos una fuente. Déjalo
            vacío en cirugía, diagnóstico y estética: ahí no aplica.
          </p>
          <label className={labelClass} htmlFor="evidencia">
            Nivel
          </label>
          <select
            id="evidencia"
            name="evidencia"
            defaultValue={tratamiento?.evidencia ?? ""}
            className={inputClass}
          >
            <option value="">No aplica / sin indicador</option>
            {NIVELES_EVIDENCIA.map((n) => (
              <option key={n} value={n}>
                {INFO_NIVEL[n].etiqueta}
              </option>
            ))}
          </select>
          <label className={`${labelClass} mt-3 block`} htmlFor="evidencia_texto">
            Qué se sabe (2-3 frases, sin promesas)
          </label>
          <textarea
            id="evidencia_texto"
            name="evidencia_texto"
            rows={3}
            defaultValue={tratamiento?.evidencia_texto ?? undefined}
            className={inputClass}
          />
          <p className={`${labelClass} mt-3`}>Fuentes (estudios o guías, con enlace https)</p>
          {Array.from({ length: MAX_FUENTES }, (_, i) => {
            const f = leerFuentes(tratamiento?.evidencia_fuentes)[i];
            return (
              <div key={i} className="mt-2 grid gap-2 sm:grid-cols-2">
                <input
                  name={`evidencia_fuente_titulo_${i}`}
                  placeholder="Título del estudio"
                  defaultValue={f?.titulo}
                  className={inputClass}
                />
                <input
                  name={`evidencia_fuente_url_${i}`}
                  placeholder="https://pubmed.ncbi.nlm.nih.gov/…"
                  defaultValue={f?.url}
                  className={inputClass}
                />
              </div>
            );
          })}
          <input
            type="hidden"
            name="evidencia_actualizada"
            value={tratamiento?.evidencia_actualizada ?? ""}
          />
          <label className="mt-3 flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="evidencia_revisada"
              defaultChecked={tratamiento?.evidencia_revisada}
            />
            Revisado por una persona con criterio médico — publicar el indicador
          </label>
        </fieldset>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="publicado"
            defaultChecked={tratamiento?.publicado ?? true}
          />
          Publicado{" "}
          <span className="text-xs text-ink-soft">
            (visible en /tratamientos)
          </span>
        </label>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="destacado_home"
            defaultChecked={tratamiento?.destacado_home}
          />
          Destacar en la portada (Home){" "}
          <span className="text-xs text-ink-soft">
            (máximo 4 tratamientos destacados a la vez)
          </span>
        </label>
      </div>

      <div className="mt-8 flex gap-3">
        <button
          type="submit"
          className="rounded-lg bg-teal px-5 py-2.5 text-sm font-medium text-paper hover:bg-teal-dark"
        >
          Guardar
        </button>
      </div>
    </form>
  );
}
