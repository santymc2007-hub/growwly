import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { SiteHeader } from "@/components/site-header";
import { crearEstudio } from "../actions";
import { BotonAnalizar } from "./boton-analizar";

// Subir 5 fotos + analizarlas con IA puede superar los 10s por defecto
// de las funciones de Vercel.
export const maxDuration = 60;

type SearchParams = { error?: string };

const SLOTS = [
  {
    name: "frontal",
    label: "Frontal",
    hint: "De frente, mirando a cámara, con el pelo apartado de la frente.",
  },
  {
    name: "donante",
    label: "Trasera / zona donante",
    hint: "La nuca, de donde normalmente se extraen los injertos.",
  },
  {
    name: "coronilla",
    label: "Coronilla",
    hint: "Vista desde arriba, mirando hacia abajo o con la cabeza inclinada.",
  },
  {
    name: "perfil_derecho",
    label: "Perfil derecho",
    hint: "De lado, mostrando la línea del pelo por el lado derecho.",
  },
  {
    name: "perfil_izquierdo",
    label: "Perfil izquierdo",
    hint: "De lado, mostrando la línea del pelo por el lado izquierdo.",
  },
] as const;

export default async function NuevoAnalisisPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { error } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/cuenta/login");
  }

  return (
    <main className="flex-1">
      <SiteHeader />

      <div className="mx-auto max-w-xl px-6 py-12">
        <Link
          href="/cuenta"
          className="text-sm font-medium text-cyan hover:text-cyan-dark"
        >
          ← Volver a mi cuenta
        </Link>

        <h1 className="mt-4 font-display text-2xl text-teal-dark">
          Análisis capilar orientativo
        </h1>
        <p className="mt-2 text-sm text-ink-soft">
          Sube las 5 fotos con buena luz y resolución, siguiendo el ángulo
          indicado en cada una. Con eso te damos una primera impresión
          orientativa — nunca un diagnóstico — y te decimos qué clínicas
          pueden ayudarte.
        </p>

        {error && (
          <p className="mt-4 rounded-lg bg-error/10 px-4 py-3 text-sm text-error-dark">
            {decodeURIComponent(error)}
          </p>
        )}

        <form action={crearEstudio} className="mt-8 flex flex-col gap-5">
          {SLOTS.map((slot) => (
            <div
              key={slot.name}
              className="rounded-xl border border-line bg-white p-4"
            >
              <label
                htmlFor={slot.name}
                className="text-sm font-medium text-ink"
              >
                {slot.label}
              </label>
              <p className="mt-0.5 text-xs text-ink-soft">{slot.hint}</p>
              <input
                id={slot.name}
                name={slot.name}
                type="file"
                accept="image/*"
                required
                className="mt-2 block w-full text-sm text-ink-soft file:mr-3 file:rounded-lg file:border-0 file:bg-sage file:px-3 file:py-2 file:text-sm file:font-medium file:text-sage-ink"
              />
            </div>
          ))}

          <p className="text-xs text-ink-soft">
            Al continuar, aceptas que estas fotos se analicen de forma
            orientativa con inteligencia artificial y se guarden en tu cuenta
            para que puedas retomar tu solicitud más adelante.
          </p>

          <BotonAnalizar />
        </form>
      </div>
    </main>
  );
}
