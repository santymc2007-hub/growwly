"use client";

import { useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { CapaFondo } from "@/components/capa-fondo";
import type { FondoWeb, TipoFondo } from "@/lib/ajustes/fondo-tipos";

const OPCIONES: { id: TipoFondo; titulo: string; texto: string }[] = [
  { id: "original", titulo: "Original", texto: "La textura de hojas de Growwly" },
  { id: "imagen", titulo: "Imagen", texto: "Sube una foto o textura" },
  { id: "color", titulo: "Color liso", texto: "Un solo color de fondo" },
];

function BotonGuardar() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-teal px-5 py-2.5 text-sm font-medium text-paper hover:bg-teal-dark disabled:opacity-60"
    >
      {pending ? "Guardando…" : "Guardar fondo"}
    </button>
  );
}

export function FormFondo({
  inicial,
  action,
}: {
  inicial: FondoWeb;
  action: (formData: FormData) => Promise<void>;
}) {
  const [tipo, setTipo] = useState<TipoFondo>(inicial.tipo);
  const [color, setColor] = useState(inicial.color);
  const [modo, setModo] = useState(inicial.modo);
  const [velo, setVelo] = useState(inicial.velo);
  const [previa, setPrevia] = useState<string | null>(null);

  // Libera la URL local de la imagen elegida al cambiarla o al salir.
  useEffect(() => {
    return () => {
      if (previa) URL.revokeObjectURL(previa);
    };
  }, [previa]);

  const fondoPrevio: FondoWeb = {
    tipo: tipo === "imagen" && !(previa ?? inicial.imagenUrl) ? "original" : tipo,
    imagenUrl: previa ?? inicial.imagenUrl,
    color,
    modo,
    velo,
  };

  return (
    <form action={action} className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
      <div className="flex flex-col gap-5">
        <fieldset>
          <legend className="text-sm font-medium text-ink">Tipo de fondo</legend>
          <div className="mt-2 grid gap-2 sm:grid-cols-3">
            {OPCIONES.map((o) => (
              <label
                key={o.id}
                className={`cursor-pointer rounded-xl border-2 p-3 text-sm transition ${
                  tipo === o.id ? "border-teal bg-sage/30" : "border-line hover:border-teal/40"
                }`}
              >
                <input
                  type="radio"
                  name="tipo"
                  value={o.id}
                  checked={tipo === o.id}
                  onChange={() => setTipo(o.id)}
                  className="sr-only"
                />
                <span className="block font-semibold text-ink">{o.titulo}</span>
                <span className="block text-xs text-ink-soft">{o.texto}</span>
              </label>
            ))}
          </div>
        </fieldset>

        {tipo === "imagen" && (
          <div className="flex flex-col gap-4 rounded-xl bg-paper-dim p-4">
            <label className="text-sm font-medium text-ink">
              Imagen
              <input
                type="file"
                name="imagen"
                accept="image/jpeg,image/png,image/webp,image/avif"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  setPrevia(f ? URL.createObjectURL(f) : null);
                }}
                className="mt-1 block w-full text-sm text-ink-soft file:mr-3 file:rounded-lg file:border-0 file:bg-teal file:px-3 file:py-2 file:text-sm file:font-medium file:text-paper"
              />
              <span className="mt-1 block text-xs font-normal text-ink-soft">
                JPG, PNG, WebP o AVIF, máx. 8 MB. Para pantalla completa, mejor horizontal y de al
                menos 1920 px de ancho.
                {inicial.imagenUrl && !previa && " Si no eliges otra, se mantiene la actual."}
              </span>
            </label>

            <fieldset>
              <legend className="text-sm font-medium text-ink">Cómo se coloca</legend>
              <div className="mt-1 flex flex-wrap gap-4 text-sm">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="modo"
                    value="cubrir"
                    checked={modo === "cubrir"}
                    onChange={() => setModo("cubrir")}
                    className="accent-teal-dark"
                  />
                  Pantalla completa
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="modo"
                    value="mosaico"
                    checked={modo === "mosaico"}
                    onChange={() => setModo("mosaico")}
                    className="accent-teal-dark"
                  />
                  En mosaico (texturas pequeñas que se repiten)
                </label>
              </div>
            </fieldset>
          </div>
        )}
        {tipo !== "imagen" && <input type="hidden" name="modo" value={modo} />}

        {tipo === "color" ? (
          <label className="flex items-center gap-3 text-sm font-medium text-ink">
            Color
            <input
              type="color"
              name="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="h-10 w-14 cursor-pointer rounded border border-line"
            />
            <span className="font-mono text-xs text-ink-soft">{color}</span>
          </label>
        ) : (
          <input type="hidden" name="color" value={color} />
        )}

        <label className="text-sm font-medium text-ink">
          Suavizar el fondo: {velo}%
          <input
            type="range"
            name="velo"
            min={0}
            max={90}
            step={5}
            value={velo}
            onChange={(e) => setVelo(Number(e.target.value))}
            className="mt-2 block w-full accent-teal-dark"
          />
          <span className="mt-1 block text-xs font-normal text-ink-soft">
            Pone una capa blanca encima para que el fondo moleste menos al leer.
          </span>
        </label>

        <div className="flex flex-wrap items-center gap-3">
          <BotonGuardar />
          <button
            type="submit"
            name="restaurar"
            value="1"
            className="rounded-lg border border-line px-4 py-2.5 text-sm font-medium text-ink hover:border-ink/40"
          >
            Restaurar el fondo original
          </button>
        </div>
      </div>

      <div>
        <p className="text-sm font-medium text-ink">Vista previa</p>
        <div className="relative mt-2 h-[300px] overflow-hidden rounded-2xl border border-line">
          <CapaFondo fondo={fondoPrevio} fija={false} />
          <div className="relative mx-6 mt-6 rounded-2xl bg-white p-5 shadow-sm">
            <div className="h-3 w-2/3 rounded-full bg-teal-dark/80" />
            <div className="mt-3 h-2 w-full rounded-full bg-ink/10" />
            <div className="mt-2 h-2 w-5/6 rounded-full bg-ink/10" />
            <div className="mt-2 h-2 w-4/6 rounded-full bg-ink/10" />
            <div className="mt-4 h-8 w-36 rounded-full bg-yellow" />
          </div>
          <div className="relative mx-6 mt-4 rounded-2xl bg-white p-5 shadow-sm">
            <div className="h-2 w-1/2 rounded-full bg-ink/10" />
          </div>
        </div>
      </div>
    </form>
  );
}
