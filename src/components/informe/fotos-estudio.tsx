"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Check, Plus, RefreshCw, X } from "lucide-react";
import { comprimirImagen } from "@/lib/comprimir-imagen";
import { OverlayCargando } from "@/components/ui/overlay-cargando";
import { ETIQUETA_ANGULO } from "@/lib/informe/fiabilidad";
import type { AnguloFoto, CalidadFoto } from "@/lib/informe/tipos";
import { recalcularEstudio } from "@/app/cuenta/analisis/actions";

export type FotoConUrl = { url: string | null; angulo: AnguloFoto; calidad: CalidadFoto };

type FotoNueva = { id: string; file: File; url: string; zona: string | null };

/** Tope de fotos por estudio: más fotos no mejoran la lectura y encarecen la IA. */
export const MAX_FOTOS_ESTUDIO = 10;

/**
 * Lista de fotos del informe. Las zonas que faltan son huecos donde se
 * puede subir la foto que falta; con al menos una foto nueva aparece el
 * botón para recalcular la valoración con todas las fotos juntas.
 */
export function FotosEstudio({
  estudioId,
  fotos,
  faltan,
}: {
  estudioId: string;
  fotos: FotoConUrl[];
  faltan: string[];
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const zonaPendiente = useRef<string | null>(null);
  const [nuevas, setNuevas] = useState<FotoNueva[]>([]);
  const [estado, setEstado] = useState<"idle" | "comprimiendo" | "recalculando">("idle");
  const [error, setError] = useState<string | null>(null);

  const hueco = MAX_FOTOS_ESTUDIO - fotos.length - nuevas.length;
  const zonasConFotoNueva = new Set(nuevas.map((n) => n.zona));

  function abrirSelector(zona: string | null) {
    zonaPendiente.current = zona;
    inputRef.current?.click();
  }

  async function onArchivos(lista: FileList | null) {
    const archivos = Array.from(lista ?? []).filter((f) => f.type.startsWith("image/"));
    if (inputRef.current) inputRef.current.value = "";
    if (archivos.length === 0) return;
    setError(null);
    setEstado("comprimiendo");
    try {
      const añadidas: FotoNueva[] = [];
      for (const [i, file] of archivos.slice(0, Math.max(0, hueco)).entries()) {
        const comprimida = await comprimirImagen(file);
        añadidas.push({
          id: crypto.randomUUID(),
          file: comprimida,
          url: URL.createObjectURL(comprimida),
          // Solo la primera foto elegida desde un hueco ocupa esa zona.
          zona: i === 0 ? zonaPendiente.current : null,
        });
      }
      setNuevas((prev) => [...prev, ...añadidas]);
    } finally {
      setEstado("idle");
    }
  }

  function quitar(id: string) {
    setNuevas((prev) => {
      const f = prev.find((n) => n.id === id);
      if (f) URL.revokeObjectURL(f.url);
      return prev.filter((n) => n.id !== id);
    });
  }

  async function recalcular() {
    if (nuevas.length === 0) return;
    setError(null);
    setEstado("recalculando");
    try {
      const formData = new FormData();
      for (const n of nuevas) formData.append("fotos", n.file);
      const res = await recalcularEstudio(estudioId, formData);
      if (res.error) {
        setError(res.error);
        return;
      }
      nuevas.forEach((n) => URL.revokeObjectURL(n.url));
      setNuevas([]);
      router.refresh();
    } finally {
      setEstado("idle");
    }
  }

  return (
    <>
      {estado !== "idle" && (
        <OverlayCargando
          mensaje={
            estado === "comprimiendo"
              ? "Optimizando tus fotos…"
              : "Volviendo a analizar todas tus fotos… puede tardar hasta un minuto. No cierres esta pantalla."
          }
        />
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => onArchivos(e.target.files)}
      />

      <ul className="flex flex-col gap-3.5">
        {fotos.map((f, i) => (
          <li key={i} className="flex items-center gap-3.5">
            <span className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-paper-dim">
              {f.url && <Image src={f.url} alt="" fill sizes="64px" className="object-cover" />}
            </span>
            <span className="flex flex-col gap-0.5">
              <span className="text-[15px] font-semibold text-teal-dark">{ETIQUETA_ANGULO[f.angulo]}</span>
              {f.calidad === "buena" ? (
                <span className="flex items-center gap-1 text-[13px] text-sage-ink">
                  <Check className="h-3.5 w-3.5" aria-hidden /> Se ve bien
                </span>
              ) : (
                <span className="text-[13px] text-[#8a5a00]">
                  {f.calidad === "mala" ? "No se ve bien · no la hemos usado" : "Calidad mejorable"}
                </span>
              )}
            </span>
          </li>
        ))}

        {nuevas.map((n) => (
          <li key={n.id} className="flex items-center gap-3.5">
            <span className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-paper-dim ring-2 ring-yellow">
              <Image src={n.url} alt="" fill sizes="64px" className="object-cover" unoptimized />
            </span>
            <span className="flex flex-1 flex-col gap-0.5">
              <span className="text-[15px] font-semibold text-teal-dark">{n.zona ?? "Foto nueva"}</span>
              <span className="text-[13px] text-ink-soft">Nueva · sin analizar todavía</span>
            </span>
            <button
              type="button"
              onClick={() => quitar(n.id)}
              aria-label="Quitar esta foto"
              className="flex h-8 w-8 items-center justify-center rounded-full text-ink-soft transition hover:bg-error/10 hover:text-error-dark"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          </li>
        ))}

        {hueco > 0 &&
          faltan
            .filter((z) => !zonasConFotoNueva.has(z))
            .map((z) => (
              <li key={z}>
                <button
                  type="button"
                  onClick={() => abrirSelector(z)}
                  className="group flex w-full items-center gap-3.5 text-left"
                >
                  <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border-2 border-dashed border-[#b9c9c4] text-teal-dark transition group-hover:border-teal group-hover:bg-sage/20">
                    <Plus className="h-5 w-5" aria-hidden />
                  </span>
                  <span className="flex flex-col gap-0.5">
                    <span className="text-[15px] font-semibold text-teal-dark">{z}</span>
                    <span className="text-[13px] text-[#8a5a00] group-hover:underline">Añadir foto · sube la fiabilidad</span>
                  </span>
                </button>
              </li>
            ))}

        {hueco > 0 && (
          <li>
            <button
              type="button"
              onClick={() => abrirSelector(null)}
              className="press inline-flex items-center gap-2 rounded-full border-2 border-yellow px-4 py-2 text-sm font-semibold text-teal-dark transition hover:bg-yellow/10"
            >
              <Plus className="h-4 w-4" aria-hidden /> Añadir otra foto
            </button>
          </li>
        )}
      </ul>

      {error && <p className="rounded-lg bg-error/10 px-3 py-2 text-sm text-error-dark">{error}</p>}

      {nuevas.length > 0 && (
        <button
          type="button"
          onClick={recalcular}
          disabled={estado !== "idle"}
          className="press flex h-[52px] items-center justify-center gap-2 rounded-full bg-teal-dark font-display text-base font-bold text-white transition hover:opacity-90 disabled:opacity-50"
        >
          <RefreshCw className="h-4 w-4" aria-hidden />
          Recalcular valoración ({nuevas.length} {nuevas.length === 1 ? "foto nueva" : "fotos nuevas"})
        </button>
      )}
    </>
  );
}
