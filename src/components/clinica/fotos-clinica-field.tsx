"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { GripVertical, Star, X } from "lucide-react";

type Entrada =
  | { id: string; tipo: "existente"; url: string }
  | { id: string; tipo: "nueva"; file: File; previewUrl: string };

/**
 * Selector de fotos de la clínica con orden controlable (arrastrar o
 * los botones ‹ › — el arrastre no funciona bien en táctil, así que
 * hace falta la alternativa). El orden importa: la primera foto es la
 * que se usa como imagen principal en los listados y en la cabecera
 * del panel.
 *
 * El input de archivo real se mantiene sincronizado por código (vía
 * DataTransfer) para que, al reordenar o borrar, el FileList que
 * viaja en el <form> tenga exactamente las fotos nuevas en el mismo
 * orden relativo en que aparecen aquí. El campo oculto fotos_orden
 * describe el orden completo (existentes + nuevas intercaladas) para
 * que el servidor pueda reconstruirlo tras subir los archivos.
 */
export function FotosClinicaField({
  fotosIniciales,
  max = 10,
}: {
  fotosIniciales: string[];
  max?: number;
}) {
  const [entradas, setEntradas] = useState<Entrada[]>(() =>
    fotosIniciales.map((url) => ({ id: url, tipo: "existente", url })),
  );
  const fileInputRef = useRef<HTMLInputElement>(null);
  const arrastrandoIndex = useRef<number | null>(null);
  const entradasRef = useRef(entradas);
  entradasRef.current = entradas;

  // Mantiene el <input type="file"> real sincronizado con las fotos
  // "nuevas" del estado, en el mismo orden — así el FormData que se
  // envía coincide con lo que se ve en pantalla.
  useEffect(() => {
    const dt = new DataTransfer();
    for (const entrada of entradas) {
      if (entrada.tipo === "nueva") dt.items.add(entrada.file);
    }
    if (fileInputRef.current) fileInputRef.current.files = dt.files;
  }, [entradas]);

  // Libera los object URL de las fotos nuevas al desmontar, para no
  // acumular memoria si se entra y sale del formulario varias veces.
  useEffect(() => {
    return () => {
      for (const entrada of entradasRef.current) {
        if (entrada.tipo === "nueva") URL.revokeObjectURL(entrada.previewUrl);
      }
    };
  }, []);

  function onFilesElegidos(files: FileList | null) {
    if (!files || files.length === 0) return;
    const hueco = Math.max(0, max - entradas.length);
    const nuevas: Entrada[] = Array.from(files)
      .slice(0, hueco)
      .map((file) => ({
        id: crypto.randomUUID(),
        tipo: "nueva",
        file,
        previewUrl: URL.createObjectURL(file),
      }));
    setEntradas((prev) => [...prev, ...nuevas]);
  }

  function eliminar(id: string) {
    setEntradas((prev) => {
      const entrada = prev.find((e) => e.id === id);
      if (entrada?.tipo === "nueva") URL.revokeObjectURL(entrada.previewUrl);
      return prev.filter((e) => e.id !== id);
    });
  }

  function mover(index: number, delta: number) {
    setEntradas((prev) => {
      const destino = index + delta;
      if (destino < 0 || destino >= prev.length) return prev;
      const copia = [...prev];
      [copia[index], copia[destino]] = [copia[destino], copia[index]];
      return copia;
    });
  }

  function onDrop(index: number) {
    const origen = arrastrandoIndex.current;
    arrastrandoIndex.current = null;
    if (origen === null || origen === index) return;
    setEntradas((prev) => {
      const copia = [...prev];
      const [movida] = copia.splice(origen, 1);
      copia.splice(index, 0, movida);
      return copia;
    });
  }

  const orden = entradas.map((e) =>
    e.tipo === "existente" ? { t: "e", url: e.url } : { t: "n" },
  );

  return (
    <div>
      <input type="hidden" name="fotos_orden" value={JSON.stringify(orden)} />
      <input
        ref={fileInputRef}
        name="fotos_nuevas"
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => onFilesElegidos(e.target.files)}
      />

      {entradas.length > 0 && (
        <div className="mt-2 grid grid-cols-3 gap-3 sm:grid-cols-5">
          {entradas.map((entrada, index) => (
            <div
              key={entrada.id}
              draggable
              onDragStart={() => {
                arrastrandoIndex.current = index;
              }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => onDrop(index)}
              className="group relative aspect-square cursor-grab overflow-hidden rounded-lg border border-line bg-sage active:cursor-grabbing"
            >
              <Image
                src={entrada.tipo === "existente" ? entrada.url : entrada.previewUrl}
                alt=""
                fill
                sizes="100px"
                className="pointer-events-none object-cover"
              />

              {index === 0 && (
                <span className="absolute left-1 top-1 flex items-center gap-1 rounded-full bg-yellow px-1.5 py-0.5 text-[10px] font-bold text-teal-dark">
                  <Star className="h-2.5 w-2.5 fill-current" aria-hidden />
                  Principal
                </span>
              )}

              <div
                aria-hidden
                className="pointer-events-none absolute left-1 bottom-1 flex h-5 w-5 items-center justify-center rounded bg-ink/40 text-white opacity-0 transition group-hover:opacity-100"
              >
                <GripVertical className="h-3.5 w-3.5" />
              </div>

              <button
                type="button"
                onClick={() => eliminar(entrada.id)}
                aria-label="Quitar foto"
                className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-ink/60 text-white transition hover:bg-error"
              >
                <X className="h-3 w-3" aria-hidden />
              </button>

              <div className="absolute inset-x-1 bottom-1 flex justify-center gap-1">
                <button
                  type="button"
                  onClick={() => mover(index, -1)}
                  disabled={index === 0}
                  aria-label="Mover a la izquierda"
                  className="flex h-5 w-5 items-center justify-center rounded bg-white/90 text-xs font-bold text-ink shadow disabled:pointer-events-none disabled:opacity-0"
                >
                  ‹
                </button>
                <button
                  type="button"
                  onClick={() => mover(index, 1)}
                  disabled={index === entradas.length - 1}
                  aria-label="Mover a la derecha"
                  className="flex h-5 w-5 items-center justify-center rounded bg-white/90 text-xs font-bold text-ink shadow disabled:pointer-events-none disabled:opacity-0"
                >
                  ›
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {entradas.length < max && (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="press mt-3 rounded-lg border border-dashed border-line px-3 py-2 text-sm font-medium text-cyan-dark hover:border-cyan/40"
        >
          + Añadir fotos ({entradas.length}/{max})
        </button>
      )}
    </div>
  );
}
