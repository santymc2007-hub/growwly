import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { CATEGORIAS_TRATAMIENTO } from "@/lib/clinic-options";

export const metadata: Metadata = {
  title: "Tratamientos capilares",
  description:
    "Guía de tratamientos capilares: diagnóstico, tratamientos médicos, injertos y estética capilar. Qué son, para quién y cómo es el proceso.",
  alternates: { canonical: "/tratamientos" },
};

export default async function TratamientosPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("tratamientos")
    .select("*")
    .eq("publicado", true)
    .order("nombre", { ascending: true });
  const tratamientos = data ?? [];

  const sinCategoria = tratamientos.filter(
    (t) => !t.categoria || !(CATEGORIAS_TRATAMIENTO as readonly string[]).includes(t.categoria),
  );

  return (
    <main className="flex-1">
      <SiteHeader />

      <div className="mx-auto max-w-[1600px] px-6 py-12">
        <h1 className="font-display text-3xl text-teal-dark">
          Tratamientos capilares
        </h1>
        <p className="mt-2 text-ink-soft">
          Qué son, para quién están indicados, y cómo es el proceso —
          explicado antes de que pidas presupuesto a ninguna clínica.
        </p>

        {CATEGORIAS_TRATAMIENTO.map((categoria) => {
          const deEstaCategoria = tratamientos.filter((t) => t.categoria === categoria);
          if (deEstaCategoria.length === 0) return null;
          return (
            <section key={categoria} className="mt-12 first:mt-10">
              <h2 className="font-display text-xl text-teal-dark">{categoria}</h2>
              <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {deEstaCategoria.map((t) => (
                  <TarjetaTratamiento key={t.id} t={t} />
                ))}
              </div>
            </section>
          );
        })}

        {sinCategoria.length > 0 && (
          <section className="mt-12">
            <h2 className="font-display text-xl text-teal-dark">Otros</h2>
            <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {sinCategoria.map((t) => (
                <TarjetaTratamiento key={t.id} t={t} />
              ))}
            </div>
          </section>
        )}
      </div>
      <SiteFooter />
    </main>
  );
}

function TarjetaTratamiento({
  t,
}: {
  t: { id: string; slug: string; nombre: string; resumen: string | null; imagen_portada: string | null };
}) {
  return (
    <Link
      href={`/tratamientos/${t.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-line bg-white transition hover:border-teal/40"
    >
      <div className="relative aspect-video w-full bg-sage">
        {t.imagen_portada && (
          <Image
            src={t.imagen_portada}
            alt={t.nombre}
            fill
            sizes="(min-width: 640px) 400px, 100vw"
            className="object-cover"
          />
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-display text-lg text-teal-dark group-hover:text-cyan">
          {t.nombre}
        </h3>
        {t.resumen && (
          <p className="mt-2 line-clamp-3 text-sm text-ink-soft">{t.resumen}</p>
        )}
      </div>
    </Link>
  );
}

