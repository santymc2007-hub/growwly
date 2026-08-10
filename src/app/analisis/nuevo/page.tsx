import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { crearEstudio } from "../actions";
import { BotonAnalizar } from "./boton-analizar";
import { SlotFoto } from "./slot-foto";

// Subir 5 fotos + analizarlas con IA puede superar los 10s por defecto
// de las funciones de Vercel.
export const maxDuration = 60;

type SearchParams = { error?: string };

const SLOTS = [
  {
    name: "frontal",
    orientacion: "frontal",
    label: "Frontal",
    hint: "De frente, mirando a cámara, con el pelo apartado de la frente.",
    imagen: "/analisis/orientacion-frontal.png",
  },
  {
    name: "donante",
    orientacion: "donante",
    label: "Trasera / zona donante",
    hint: "La nuca, de donde normalmente se extraen los injertos.",
    imagen: "/analisis/orientacion-trasera.png",
  },
  {
    name: "coronilla",
    orientacion: "coronilla",
    label: "Coronilla",
    hint: "Vista desde arriba, mirando hacia abajo o con la cabeza inclinada.",
    imagen: "/analisis/orientacion-coronilla.png",
  },
  {
    name: "perfil_derecho",
    orientacion: "perfil_derecho",
    label: "Perfil derecho",
    hint: "De lado, mostrando la línea del pelo por el lado derecho.",
    imagen: "/analisis/orientacion-perfil-derecho.png",
  },
  {
    name: "perfil_izquierdo",
    orientacion: "perfil_izquierdo",
    label: "Perfil izquierdo",
    hint: "De lado, mostrando la línea del pelo por el lado izquierdo.",
    imagen: "/analisis/orientacion-perfil-izquierdo.png",
  },
] as const;

export default async function NuevoAnalisisPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { error } = await searchParams;

  return (
    <main className="flex-1">
      <SiteHeader />

      <div className="mx-auto max-w-5xl px-6 py-12">
        <Link
          href="/"
          className="text-sm font-medium text-cyan hover:text-cyan-dark"
        >
          ← Volver al inicio
        </Link>

        <h1 className="mt-4 font-display text-3xl text-teal-dark">
          Análisis capilar orientativo
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-ink-soft">
          Sube fotos con buena luz y resolución. Estos 5 ángulos son los que
          más nos ayudan a valorar bien tu caso, pero{" "}
          <strong className="font-medium text-ink">
            ninguno es obligatorio
          </strong>{" "}
          — sube al menos una foto, y cuantas más subas (incluidas fotos
          adicionales al final), más fino puede ser el resultado.
        </p>
        <p className="mt-2 max-w-2xl text-sm text-ink-soft">
          No hace falta tener cuenta para empezar — solo para ver el
          resultado, que quedará guardado en tu perfil.
        </p>

        {error && (
          <p className="mt-4 rounded-lg bg-error/10 px-4 py-3 text-sm text-error-dark">
            {decodeURIComponent(error)}
          </p>
        )}

        <form action={crearEstudio} className="mt-8 flex flex-col gap-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {SLOTS.map((slot) => (
              <SlotFoto key={slot.name} {...slot} />
            ))}
          </div>

          <div className="rounded-2xl border border-dashed border-line bg-white p-4">
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

          <p className="max-w-2xl text-xs text-ink-soft">
            Al continuar, aceptas que estas fotos se analicen de forma
            orientativa con inteligencia artificial y se guarden asociadas a
            tu cuenta (o a la que crees a continuación) para poder retomar tu
            solicitud más adelante.
          </p>

          <BotonAnalizar />
        </form>
      </div>
      <SiteFooter />
    </main>
  );
}
