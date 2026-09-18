"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { comprimirFormData } from "@/lib/comprimir-imagen";
import { OverlayCargando } from "@/components/ui/overlay-cargando";
import { SlotFoto } from "./slot-foto";

type Slot = {
  name: string;
  orientacion: string;
  label: string;
  hint: string;
  imagen: string;
};

export function AnalisisForm({
  action,
  slots,
}: {
  action: (formData: FormData) => void;
  slots: readonly Slot[];
}) {
  const [estado, setEstado] = useState<"idle" | "comprimiendo" | "enviando">("idle");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setEstado("comprimiendo");
    try {
      // Las fotos de móvil sin optimizar (a veces 5-10MB cada una, y a
      // veces en HEIC) son la causa más habitual de que el análisis
      // falle en el móvil — se comprimen aquí antes de subirlas, lo que
      // de paso las deja siempre en JPEG.
      const original = new FormData(e.currentTarget);
      const comprimido = await comprimirFormData(original);
      setEstado("enviando");
      await action(comprimido);
      // La action redirige internamente al terminar (tanto si va bien
      // como si hay error), así que normalmente no se llega más allá.
    } finally {
      setEstado("idle");
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6">
      {estado !== "idle" && (
        <OverlayCargando
          mensaje={
            estado === "comprimiendo"
              ? "Optimizando tus fotos…"
              : "Subiendo y analizando tus fotos con IA… puede tardar hasta un minuto. No cierres ni recargues esta pantalla."
          }
        />
      )}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {slots.map((slot) => (
          <SlotFoto key={slot.name} {...slot} />
        ))}
      </div>

      <div className="flex items-start gap-4 rounded-2xl border border-dashed border-line bg-white p-5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sage text-sage-ink">
          <Plus className="h-5 w-5" aria-hidden />
        </div>
        <div className="flex-1">
          <label htmlFor="adicionales" className="text-sm font-medium text-ink">
            Fotos adicionales{" "}
            <span className="font-normal text-ink-soft">(opcional)</span>
          </label>
          <p className="mt-0.5 text-xs text-ink-soft">
            Cualquier otra foto que ayude — primeros planos, otros ángulos,
            distinta luz. Cuantas más, más fino será el análisis.
          </p>
          <input
            id="adicionales"
            name="adicionales"
            type="file"
            accept="image/*"
            multiple
            className="mt-2 block w-full text-sm text-ink-soft file:mr-3 file:rounded-lg file:border-0 file:bg-sage file:px-3 file:py-2 file:text-sm file:font-medium file:text-sage-ink"
          />
        </div>
      </div>

      <p className="max-w-2xl text-xs text-ink-soft">
        Al continuar, aceptas que estas fotos se analicen de forma
        orientativa con inteligencia artificial y se guarden asociadas a tu
        cuenta (o a la que crees a continuación) para poder retomar tu
        solicitud más adelante.
      </p>

      <button
        type="submit"
        disabled={estado !== "idle"}
        className="press mt-6 w-full rounded-full bg-ink px-7 py-4 font-display text-sm font-bold uppercase tracking-wide text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
      >
        {estado === "comprimiendo"
          ? "Optimizando tus fotos…"
          : estado === "enviando"
            ? "Subiendo y analizando tus fotos… puede tardar un momento"
            : "Analizar mis fotos"}
      </button>
    </form>
  );
}
