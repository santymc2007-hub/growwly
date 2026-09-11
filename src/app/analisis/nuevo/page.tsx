import Image from "next/image";
import Link from "next/link";
import { Plus, Sparkles } from "lucide-react";
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

      <div className="relative overflow-hidden bg-gradient-to-br from-[#fbe0ea] via-[#f1e6fb] to-[#dcebfb]">
        <div className="mx-auto grid max-w-[1600px] items-center gap-10 px-6 py-14 sm:py-20 lg:grid-cols-[1fr_0.85fr] lg:px-12">
          <div>
            <Link
              href="/"
              className="text-sm font-medium text-ink-soft hover:text-ink"
            >
              ← Volver al inicio
            </Link>

            <h1 className="mt-4 font-display text-4xl font-extrabold leading-tight text-ink sm:text-5xl">
              Análisis capilar orientativo
            </h1>
            <p className="mt-4 max-w-xl text-base text-ink-soft">
              Sube fotos con buena luz y resolución. Estos 5 ángulos son los
              que más nos ayudan a valorar bien tu caso, pero{" "}
              <strong className="font-semibold text-ink">
                ninguno es obligatorio
              </strong>{" "}
              — sube al menos una foto, y cuantas más subas (incluidas fotos
              adicionales al final), más fino puede ser el resultado.
            </p>

            <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-2 text-sm font-medium text-ink shadow-sm backdrop-blur">
              <Sparkles className="h-4 w-4 text-cyan-dark" aria-hidden />
              Análisis con inteligencia artificial
            </div>

            <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3">
              <a
                href="#fotos"
                className="press inline-block rounded-full bg-ink px-7 py-3.5 font-display text-sm font-bold uppercase tracking-wide text-white transition hover:opacity-90"
              >
                Subir fotos y análisis de IA
              </a>
              <p className="max-w-xs text-sm text-ink-soft">
                No hace falta tener cuenta para empezar — solo para ver el
                resultado, que quedará guardado en tu perfil.
              </p>
            </div>
          </div>

          <div className="relative mx-auto aspect-[1114/889] w-full max-w-sm lg:max-w-none">
            <Image
              src="/brand/hero-persona.png"
              alt=""
              fill
              sizes="(min-width: 1024px) 40vw, 80vw"
              className="object-contain object-bottom"
              priority
            />
            <div className="absolute bottom-4 right-0 max-w-[220px] rounded-2xl bg-white px-4 py-3 text-sm font-medium text-ink shadow-lg sm:bottom-8">
              Tu evaluación en minutos con nuestra IA
            </div>
          </div>
        </div>
      </div>

      <div id="fotos" className="mx-auto max-w-[1600px] scroll-mt-6 px-6 py-10 sm:py-12">
        {error && (
          <p className="mb-6 rounded-lg bg-error/10 px-4 py-3 text-sm text-error-dark">
            {decodeURIComponent(error)}
          </p>
        )}

        <form action={crearEstudio} className="flex flex-col gap-6">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {SLOTS.map((slot) => (
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
                Cualquier otra foto que ayude — primeros planos, otros
                ángulos, distinta luz. Cuantas más, más fino será el análisis.
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
