import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const metadata: Metadata = {
  title: "Tratamientos capilares",
  description:
    "Guía de tratamientos capilares: injertos FUE, DHI, FUT, mesoterapia, PRP y micropigmentación. Qué son, para quién y cómo es el proceso.",
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

        <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {tratamientos.map((t) => (
            <Link
              key={t.id}
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
                <h2 className="font-display text-lg text-teal-dark group-hover:text-cyan">
                  {t.nombre}
                </h2>
                {t.resumen && (
                  <p className="mt-2 line-clamp-3 text-sm text-ink-soft">
                    {t.resumen}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
      <SiteFooter />
    </main>
  );
}
