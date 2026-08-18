import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { DeleteSlideButton } from "./delete-button";
import { OrderControls } from "./order-controls";

export default async function AdminHeroSlidesPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("hero_slides")
    .select("*")
    .order("orden", { ascending: true });
  const slides = data ?? [];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl text-teal-dark">
            Slides del hero
          </h1>
          <p className="mt-1 text-sm text-ink-soft">
            Carrusel de la portada de la home. {slides.length}{" "}
            {slides.length === 1 ? "slide" : "slides"}.
          </p>
        </div>
        <Link
          href="/admin/hero-slides/nuevo"
          className="rounded-lg bg-teal px-4 py-2 text-sm font-medium text-paper hover:bg-teal-dark"
        >
          + Nueva slide
        </Link>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-line bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-paper-dim text-ink-soft">
            <tr>
              <th className="px-4 py-3 font-medium">Orden</th>
              <th className="px-4 py-3 font-medium">Imagen</th>
              <th className="px-4 py-3 font-medium">Titular</th>
              <th className="px-4 py-3 font-medium">Enlace</th>
              <th className="px-4 py-3 font-medium">Estado</th>
              <th className="px-4 py-3 font-medium text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {slides.map((slide, i) => (
              <tr key={slide.id} className="border-t border-line align-middle">
                <td className="px-4 py-3">
                  <OrderControls
                    id={slide.id}
                    activo={slide.activo}
                    isFirst={i === 0}
                    isLast={i === slides.length - 1}
                  />
                </td>
                <td className="px-4 py-3">
                  {slide.imagen_url ? (
                    <div className="relative h-12 w-16 overflow-hidden rounded-md border border-line bg-sage/30">
                      <Image
                        src={slide.imagen_url}
                        alt=""
                        fill
                        sizes="64px"
                        className="object-contain"
                      />
                    </div>
                  ) : (
                    <div className="flex h-12 w-16 items-center justify-center rounded-md border border-dashed border-line text-xs text-ink-soft">
                      Sin foto
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 font-medium text-ink">
                  {[slide.antes, slide.destacado, slide.despues]
                    .filter(Boolean)
                    .join(" ")}
                </td>
                <td className="px-4 py-3 text-ink-soft">{slide.enlace}</td>
                <td className="px-4 py-3">
                  {slide.activo ? (
                    <span className="rounded-full bg-sage px-2.5 py-1 text-xs font-medium text-sage-ink">
                      Activa
                    </span>
                  ) : (
                    <span className="rounded-full bg-paper-dim px-2.5 py-1 text-xs font-medium text-ink-soft">
                      Inactiva
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-3">
                    <Link
                      href={`/admin/hero-slides/${slide.id}/editar`}
                      className="font-medium text-cyan hover:text-cyan-dark"
                    >
                      Editar
                    </Link>
                    <DeleteSlideButton
                      id={slide.id}
                      titulo={slide.destacado}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {slides.length === 0 && (
          <p className="px-4 py-8 text-center text-sm text-ink-soft">
            Todavía no hay ninguna slide — la home usa una de reserva
            mientras tanto.
          </p>
        )}
      </div>
    </div>
  );
}
