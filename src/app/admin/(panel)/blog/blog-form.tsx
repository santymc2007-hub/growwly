import Image from "next/image";
import type { BlogPost } from "@/lib/supabase/database.types";

type Props = {
  action: (formData: FormData) => void;
  post?: BlogPost;
  error?: string;
};

const inputClass =
  "mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-teal/30";
const labelClass = "text-sm font-medium text-ink";

export function BlogForm({ action, post, error }: Props) {
  return (
    <form action={action} className="max-w-2xl">
      {error && (
        <p className="mb-6 rounded-lg bg-error/10 px-4 py-3 text-sm text-error-dark">
          {decodeURIComponent(error)}
        </p>
      )}

      <div className="flex flex-col gap-4">
        <div>
          <label className={labelClass} htmlFor="titulo">
            Título
          </label>
          <input
            id="titulo"
            name="titulo"
            required
            defaultValue={post?.titulo ?? undefined}
            className={inputClass}
          />
          {post?.slug && (
            <p className="mt-1 text-xs text-ink-soft">
              URL: /blog/{post.slug} (no cambia aunque edites el título)
            </p>
          )}
        </div>

        <div>
          <label className={labelClass} htmlFor="resumen">
            Resumen (aparece en el listado y en buscadores)
          </label>
          <textarea
            id="resumen"
            name="resumen"
            rows={2}
            defaultValue={post?.resumen ?? undefined}
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass} htmlFor="autor">
            Autor
          </label>
          <input
            id="autor"
            name="autor"
            defaultValue={post?.autor ?? "Growwly"}
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass} htmlFor="imagen_portada">
            Imagen de portada
          </label>
          {post?.imagen_portada && (
            <div className="relative mb-2 h-40 w-full overflow-hidden rounded-lg border border-line">
              <Image
                src={post.imagen_portada}
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
          <p className="mt-1 text-xs text-ink-soft">
            {post?.imagen_portada
              ? "Sube una nueva solo si quieres sustituirla."
              : "Opcional."}
          </p>
        </div>

        <div>
          <label className={labelClass} htmlFor="contenido">
            Contenido (admite Markdown: # título, **negrita**, - listas,
            [enlace](https://...))
          </label>
          <textarea
            id="contenido"
            name="contenido"
            rows={16}
            defaultValue={post?.contenido ?? undefined}
            className={`${inputClass} font-mono text-xs`}
          />
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="publicado"
            defaultChecked={post?.publicado}
          />
          Publicado{" "}
          <span className="text-xs text-ink-soft">
            (visible en /blog — desmárcalo para dejarlo en borrador)
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
