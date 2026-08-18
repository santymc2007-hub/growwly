import Image from "next/image";
import type { HeroSlide } from "@/lib/supabase/database.types";
import { TitularEditor } from "./titular-editor";

type Props = {
  action: (formData: FormData) => void;
  slide?: HeroSlide;
  error?: string;
};

const inputClass =
  "mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-teal/30";
const labelClass = "text-sm font-medium text-ink";

export function HeroSlideForm({ action, slide, error }: Props) {
  return (
    <form action={action} className="max-w-2xl">
      {error && (
        <p className="mb-6 rounded-lg bg-error/10 px-4 py-3 text-sm text-error-dark">
          {decodeURIComponent(error)}
        </p>
      )}

      <div className="flex flex-col gap-4">
        <div>
          <label className={labelClass}>Titular</label>
          <TitularEditor
            name="titular_html"
            defaultValueHtml={slide?.titular_html}
          />
        </div>

        <div>
          <label className={labelClass} htmlFor="subtitulo">
            Subtítulo
          </label>
          <input
            id="subtitulo"
            name="subtitulo"
            placeholder="¡Ah! Y con presupuesto personalizado"
            defaultValue={slide?.subtitulo ?? undefined}
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass} htmlFor="color_fondo">
            Color de fondo del recuadro
          </label>
          <div className="mt-1 flex items-center gap-3">
            <input
              id="color_fondo"
              name="color_fondo"
              type="color"
              defaultValue={slide?.color_fondo ?? "#ecf7f1"}
              className="h-10 w-16 cursor-pointer rounded-lg border border-line bg-white p-1"
            />
            <span className="text-xs text-ink-soft">
              Por defecto, el verde menta que ya usa la home.
            </span>
          </div>
        </div>

        <div>
          <label className={labelClass} htmlFor="imagen">
            Imagen
          </label>
          {slide?.imagen_url && (
            <div className="relative mb-2 h-40 w-full overflow-hidden rounded-lg border border-line bg-sage/30">
              <Image
                src={slide.imagen_url}
                alt=""
                fill
                sizes="600px"
                className="object-contain"
              />
            </div>
          )}
          <input
            id="imagen"
            name="imagen"
            type="file"
            accept="image/*"
            className="mt-1 block w-full text-sm text-ink-soft file:mr-3 file:rounded-lg file:border-0 file:bg-sage file:px-3 file:py-2 file:text-sm file:font-medium file:text-sage-ink"
          />
          <p className="mt-1 text-xs text-ink-soft">
            {slide?.imagen_url
              ? "Sube una nueva solo si quieres sustituirla."
              : "Recomendado: PNG con fondo transparente, misma proporción que la actual."}
          </p>
        </div>

        <div>
          <label className={labelClass} htmlFor="enlace">
            Enlace del botón
          </label>
          <input
            id="enlace"
            name="enlace"
            placeholder="/analisis/nuevo"
            defaultValue={slide?.enlace ?? "/analisis/nuevo"}
            className={inputClass}
          />
          <p className="mt-1 text-xs text-ink-soft">
            Ruta interna (ej. /analisis/nuevo) o URL completa (https://...).
          </p>
        </div>

        <div>
          <label className={labelClass} htmlFor="texto_boton">
            Texto del botón
          </label>
          <input
            id="texto_boton"
            name="texto_boton"
            placeholder="Subir fotos"
            defaultValue={slide?.texto_boton ?? "Subir fotos"}
            className={inputClass}
          />
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="activo"
            defaultChecked={slide?.activo ?? true}
          />
          Activa{" "}
          <span className="text-xs text-ink-soft">
            (visible en el carrusel de la home — desmárcalo para ocultarla sin borrarla)
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
