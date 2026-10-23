"use client";

import { useState } from "react";
import { slugify } from "@/lib/slugify";

/**
 * Title SEO (con contador) y slug editable para posts y tratamientos.
 * El title admite 50 caracteres: Google muestra ~60 y la web añade
 * " | Growwly" (10). Si cambia el slug, la URL antigua redirige sola.
 */
export function CamposSeo({
  base,
  slugActual,
  seoTitleActual,
  placeholderTitle,
}: {
  /** "/blog" o "/tratamientos" */
  base: string;
  slugActual?: string | null;
  seoTitleActual?: string | null;
  placeholderTitle?: string;
}) {
  const [title, setTitle] = useState(seoTitleActual ?? "");
  const [slug, setSlug] = useState(slugActual ?? "");
  const MAX = 50;
  const largo = title.length;
  const color = largo === 0 ? "text-ink-soft" : largo > MAX ? "text-error" : "text-green";
  const limpio = slugify(slug);

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-line bg-paper-dim/40 p-4">
      <p className="text-sm font-semibold text-teal-dark">SEO</p>
      <div>
        <div className="flex items-baseline justify-between gap-2">
          <label className="text-sm font-medium text-ink" htmlFor="seo_title">
            Title para Google <span className="text-xs text-ink-soft">(opcional)</span>
          </label>
          <span className={`shrink-0 text-xs font-medium ${color}`}>
            {largo === 0 ? "automático" : MAX - largo >= 0 ? `${MAX - largo} restantes` : `${largo - MAX} de más`}
          </span>
        </div>
        <input
          id="seo_title"
          name="seo_title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={placeholderTitle}
          className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-teal/30"
        />
        <p className="mt-1 text-xs text-ink-soft">
          Máx. {MAX} caracteres (se añade &quot;| Growwly&quot;). Vacío = se genera solo.
        </p>
      </div>
      <div>
        <label className="text-sm font-medium text-ink" htmlFor="slug">
          URL (slug)
        </label>
        <input
          id="slug"
          name="slug"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          placeholder="se genera desde el título"
          className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 font-mono text-sm text-ink focus:outline-none focus:ring-2 focus:ring-teal/30"
        />
        <p className="mt-1 text-xs text-ink-soft">
          {base}/{limpio || "…"}
          {slugActual && limpio && limpio !== slugActual && (
            <span className="ml-1 text-orange">· la URL antigua redirigirá a esta</span>
          )}
        </p>
      </div>
    </div>
  );
}
