import Image from "next/image";
import type { Tratamiento } from "@/lib/supabase/database.types";
import { TECNICAS_DISPONIBLES, CATEGORIAS_TRATAMIENTO } from "@/lib/clinic-options";
import { CampoMetaDescripcion } from "@/components/admin/campo-meta-description";

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
          {tratamiento?.slug && (
            <p className="mt-1 text-xs text-ink-soft">
              URL: /tratamientos/{tratamiento.slug}
            </p>
          )}
        </div>

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
              (cuerpo de la ficha: qué es, para quién, proceso,
              recuperación — Markdown: ## para H2, listas con -, **negrita**)
            </span>
          </label>
          <textarea
            id="contenido"
            name="contenido"
            rows={16}
            defaultValue={tratamiento?.contenido ?? undefined}
            className={`${inputClass} font-mono text-xs`}
          />
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
