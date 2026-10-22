"use client";

import { useState } from "react";
import { slugify } from "@/lib/slugify";
import { MAX_META, MAX_TITLE, MIN_META, SUFIJO_TITLE } from "@/lib/seo/meta";

// Slug: corto y con la keyword. A partir de ~60 caracteres la URL se
// trunca en Google y cuesta leerla.
const MAX_SLUG = 60;
const MIN_TITLE = 30;

const inputClass =
  "mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-teal/30";

type Props = {
  /** Ruta pública sin barra final, p. ej. "/tratamientos" o "/blog". */
  basePath: string;
  slug?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  /** Se muestra si el contenido ya está publicado: cambiar el slug cambia la URL. */
  publicado?: boolean;
};

function Contador({
  longitud,
  min,
  max,
}: {
  longitud: number;
  min: number;
  max: number;
}) {
  let color = "text-ink-soft";
  if (longitud > max) color = "text-error";
  else if (longitud >= min) color = "text-green";
  return (
    <span className={`shrink-0 text-xs font-medium tabular-nums ${color}`}>
      {longitud}/{max}
    </span>
  );
}

export function CamposSeo({
  basePath,
  slug,
  metaTitle,
  metaDescription,
  publicado,
}: Props) {
  const [valorSlug, setValorSlug] = useState(slug ?? "");
  const [titulo, setTitulo] = useState(metaTitle ?? "");
  const [descripcion, setDescripcion] = useState(metaDescription ?? "");

  const slugLimpio = slugify(valorSlug);
  const cabeSufijo = titulo.length + SUFIJO_TITLE.length <= MAX_TITLE;
  const tituloVisto = titulo
    ? cabeSufijo
      ? `${titulo}${SUFIJO_TITLE}`
      : titulo
    : "";

  return (
    <fieldset className="flex flex-col gap-4 rounded-xl border border-line bg-paper p-4">
      <legend className="px-1 text-sm font-semibold text-ink">SEO</legend>

      <div>
        <div className="flex items-baseline justify-between gap-2">
          <label className="text-sm font-medium text-ink" htmlFor="slug">
            Slug{" "}
            <span className="text-xs font-normal text-ink-soft">
              (vacío = se genera del título)
            </span>
          </label>
          <Contador longitud={slugLimpio.length} min={1} max={MAX_SLUG} />
        </div>
        <input
          id="slug"
          name="slug"
          value={valorSlug}
          onChange={(e) => setValorSlug(e.target.value)}
          onBlur={() => setValorSlug(slugLimpio)}
          placeholder="injerto-capilar-fue"
          className={inputClass}
        />
        <p className="mt-1 text-xs text-ink-soft">
          URL: {basePath}/{slugLimpio || "…"}
          {publicado && slug && slugLimpio && slugLimpio !== slug && (
            <span className="block text-error-dark">
              Cambia la URL publicada. La antigua redirigirá a la nueva, pero
              revisa los enlaces internos que apunten a /{slug}.
            </span>
          )}
        </p>
      </div>

      <div>
        <div className="flex items-baseline justify-between gap-2">
          <label className="text-sm font-medium text-ink" htmlFor="meta_title">
            Meta title{" "}
            <span className="text-xs font-normal text-ink-soft">
              (vacío = se genera automáticamente)
            </span>
          </label>
          <Contador
            longitud={tituloVisto.length}
            min={MIN_TITLE}
            max={MAX_TITLE}
          />
        </div>
        <input
          id="meta_title"
          name="meta_title"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          className={inputClass}
        />
        <p className="mt-1 text-xs text-ink-soft">
          Ideal entre {MIN_TITLE} y {MAX_TITLE} caracteres contando
          &ldquo;{SUFIJO_TITLE.trim()}&rdquo;.{" "}
          {titulo &&
            (cabeSufijo
              ? "Se añadirá la marca al final."
              : "No cabe la marca: saldrá sin ella.")}
        </p>
      </div>

      <div>
        <div className="flex items-baseline justify-between gap-2">
          <label
            className="text-sm font-medium text-ink"
            htmlFor="meta_description"
          >
            Meta description{" "}
            <span className="text-xs font-normal text-ink-soft">
              (vacío = se usa el resumen)
            </span>
          </label>
          <Contador
            longitud={descripcion.length}
            min={MIN_META}
            max={MAX_META}
          />
        </div>
        <textarea
          id="meta_description"
          name="meta_description"
          rows={3}
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          className={inputClass}
        />
        <p className="mt-1 text-xs text-ink-soft">
          Ideal entre {MIN_META} y {MAX_META} caracteres. Fuera de ese rango
          Google puede cortarla o reescribirla.
        </p>
      </div>

      {(titulo || descripcion) && (
        <div className="rounded-lg border border-line bg-white p-3">
          <p className="text-xs text-ink-soft">Vista previa en Google</p>
          <p className="mt-1 truncate text-xs text-ink-soft">
            growwly.es › {basePath.replace("/", "")} › {slugLimpio}
          </p>
          <p className="truncate text-base text-[#1a0dab]">
            {tituloVisto || "Título automático"}
          </p>
          <p className="line-clamp-2 text-sm text-ink-soft">
            {descripcion || "Se usará el resumen."}
          </p>
        </div>
      )}
    </fieldset>
  );
}
