import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ClinicCard } from "@/components/clinics/clinic-card";
import { ClinicaDeLaSemana } from "@/components/clinics/clinica-de-la-semana";
import { obtenerClinicaDeLaSemana } from "@/lib/clinica/clinica-de-la-semana";
import { Hero } from "@/components/home/hero";
import { AnnouncementBar } from "@/components/home/announcement-bar";
import { TratamientosDestacados } from "@/components/home/tratamientos-destacados";
import { CATEGORIAS_TRATAMIENTO } from "@/lib/clinic-options";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

const PASOS = [
  {
    icono: "/brand/icono-paso-camara.png",
    titulo: "1. Sube tu foto",
    texto: "Hazte una foto de la zona que te preocupa.",
  },
  {
    icono: "/brand/icono-paso-ia.png",
    titulo: "2. IA analiza",
    texto: "Nuestro sistema de IA evalúa tu caso en segundos.",
  },
  {
    icono: "/brand/icono-paso-documento.png",
    titulo: "3. Recibe tu valoración",
    texto: "Te damos un informe gratuito con el diagnóstico.",
  },
  {
    icono: "/brand/icono-paso-envelope.png",
    titulo: "4. Solicita presupuestos",
    texto: "Recibe ofertas de clínicas especializadas que se ajustan a tu caso.",
  },
];

export default async function HomePage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("clinics")
    .select("*")
    .eq("publicado", true)
    .or("destacado.eq.true,destacado_home.eq.true")
    .order("destacado_home", { ascending: false })
    .order("destacado", { ascending: false })
    .order("orden", { ascending: true })
    .limit(8);
  const destacadas = data ?? [];
  const clinicaDeLaSemana = await obtenerClinicaDeLaSemana("Illes Balears");

  const { data: tratamientosData } = await supabase
    .from("tratamientos")
    .select("slug, nombre, categoria, imagen_portada")
    .eq("publicado", true)
    .order("nombre", { ascending: true });
  // Un tratamiento real por categoría (el primero alfabéticamente),
  // nunca inventado — así las 4 tarjetas siempre enlazan a fichas que existen.
  const tratamientosDestacados = CATEGORIAS_TRATAMIENTO.map((categoria) =>
    (tratamientosData ?? []).find((t) => t.categoria === categoria),
  ).filter((t): t is NonNullable<typeof t> => Boolean(t));

  return (
    <main className="relative flex-1 bg-[url('/brand/textura-hojas.png')] bg-cover bg-fixed bg-top">
      <AnnouncementBar />
      <SiteHeader />
      <Hero />

      {/* A partir de aquí, todo el "desarrollo" de la home vive en una
          única caja blanca continua que flota sobre el fondo — logo,
          menú y hero son lo único que va directamente sobre el fondo. */}
      <div className="mx-auto max-w-[1600px] px-3 pb-8 sm:px-6 sm:pb-10">
        <div className="overflow-hidden rounded-3xl bg-white shadow-sm">
          {/* Qué es Growwly */}
          <div className="px-6 py-8 sm:px-10 sm:py-10">
            <div className="rounded-3xl bg-paper-dim px-6 py-10 text-center sm:px-10 sm:py-14">
              <h2 className="font-display text-2xl font-extrabold text-teal-dark sm:text-3xl lg:text-4xl">
                El directorio nº1 de clínicas capilares verificadas en España
              </h2>
              <p className="mt-3 text-base text-ink-soft sm:text-lg">
                Tratamientos, opiniones reales y precios sin fricción
              </p>
              <div className="mt-6 flex justify-center">
                <span className="relative inline-block px-3 py-1.5">
                  <svg
                    aria-hidden
                    viewBox="0 0 220 60"
                    preserveAspectRatio="none"
                    className="absolute -inset-x-3 -inset-y-1.5 h-[calc(100%+12px)] w-[calc(100%+24px)] text-yellow"
                  >
                    <path
                      fill="currentColor"
                      d="M8,32 C4,18 14,8 34,9 C70,6 150,4 195,10 C214,12 216,26 210,34 C214,42 210,54 190,52 C140,56 60,58 20,50 C4,47 3,40 8,32 Z"
                    />
                  </svg>
                  <span className="relative font-display text-2xl font-bold text-teal-dark sm:text-3xl">
                    Hair we go!
                  </span>
                </span>
              </div>
            </div>
          </div>

          {/* Clínicas destacadas */}
          {destacadas.length > 0 && (
            <div className="border-t border-line px-6 py-10 sm:px-10">
              <h2 className="font-display text-4xl font-extrabold text-teal-dark">
                Clínicas destacadas
              </h2>
              <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
                {destacadas.map((clinic) => (
                  <ClinicCard key={clinic.id} clinic={clinic} />
                ))}
              </div>
              <Link
                href="/clinicas"
                className="press mt-8 inline-block rounded-full bg-yellow px-6 py-3 font-display text-base font-bold text-teal-dark shadow-lg shadow-yellow/30 transition hover:opacity-90"
              >
                Ver todas las clínicas
              </Link>
            </div>
          )}

          {/* Así de fácil */}
          <div id="como-funciona" className="border-t border-line bg-paper-dim px-6 py-5 sm:px-10">
            <div className="lg:grid lg:grid-cols-[1fr_368px] lg:items-center lg:gap-8">
              <div>
                <h2 className="font-display text-4xl font-extrabold text-teal-dark">
                  Así de fácil
                </h2>
                <p className="mt-3 max-w-md text-lg text-ink-soft">
                  Tu valoración capilar en 4 sencillos pasos.
                </p>

                <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-4">
                  {PASOS.map((paso, i) => (
                    <div key={paso.titulo} className="relative">
                      <Image
                        src={paso.icono}
                        alt=""
                        width={112}
                        height={112}
                        className="h-28 w-28"
                      />
                      <h3 className="mt-4 font-display text-base font-bold text-teal-dark">
                        {paso.titulo}
                      </h3>
                      <p className="mt-1 text-sm text-ink-soft">{paso.texto}</p>
                      {i < PASOS.length - 1 && (
                        <span
                          aria-hidden
                          className="absolute -right-4 top-12 hidden text-xl font-bold text-cyan sm:block"
                        >
                          →
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="relative mx-auto mt-12 hidden aspect-[1136/1385] w-full max-w-[368px] lg:mt-0 lg:block">
                <Image
                  src="/brand/asi-de-facil-phone.png"
                  alt="Análisis capilar con IA en el móvil"
                  fill
                  sizes="368px"
                  className="object-contain"
                />
              </div>
            </div>
          </div>

          {/* Tratamientos destacados */}
          {tratamientosDestacados.length > 0 && (
            <div className="border-t border-line px-6 py-10 sm:px-10">
              <TratamientosDestacados tratamientos={tratamientosDestacados} />
            </div>
          )}

          {/* CTA clínicas */}
          <div className="border-t border-line px-6 py-10 sm:px-10">
            <div className="flex flex-col items-center gap-3 rounded-3xl bg-gradient-to-br from-brand-blue/40 via-white to-brand-green/30 px-6 py-14 text-center">
              <p className="font-display text-3xl font-bold text-teal-dark">
                ¿Tienes una clínica capilar?
              </p>
              <p className="max-w-md text-base text-teal-dark/80">
                Reclama tu ficha en el directorio y recibe solicitudes de
                presupuesto de pacientes reales.
              </p>
              <Link
                href="/clinica/registro"
                className="press mt-2 inline-block rounded-full bg-gradient-to-r from-yellow to-orange px-6 py-3 font-display text-base font-bold text-teal-dark shadow-lg shadow-orange/20 transition hover:opacity-90"
              >
                Únete
              </Link>
            </div>
          </div>
        </div>
      </div>

      {clinicaDeLaSemana && <ClinicaDeLaSemana clinic={clinicaDeLaSemana} />}

      <SiteFooter />
    </main>
  );
}
