import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { Camera, Cpu, FileText, Mail, Check, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ClinicCard } from "@/components/clinics/clinic-card";
import { ClinicaDeLaSemana } from "@/components/clinics/clinica-de-la-semana";
import { obtenerClinicaDeLaSemana } from "@/lib/clinica/clinica-de-la-semana";
import { HeroCarousel } from "@/components/home/hero-carousel";
import { AnnouncementBar } from "@/components/home/announcement-bar";
import { TratamientosDestacados } from "@/components/home/tratamientos-destacados";
import { CATEGORIAS_TRATAMIENTO } from "@/lib/clinic-options";
import type { HeroSlide } from "@/lib/supabase/database.types";

// Se usa solo si la tabla hero_slides está vacía (p. ej. antes de
// ejecutar la migración, o si se desactivan todas las slides sin querer).
const SLIDE_POR_DEFECTO: HeroSlide = {
  id: "default",
  orden: 0,
  titular_html:
    'Tu <span class="hl">valoración con IA</span> en un par de clics',
  subtitulo: "¡Ah! Y con presupuesto personalizado",
  color_fondo: "#1f5568",
  imagen_url: "/brand/hero-persona.png",
  enlace: "/analisis/nuevo",
  texto_boton: "Quiero mi valoración",
  activo: true,
  created_at: "",
  updated_at: "",
};

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

const PASOS = [
  {
    icono: Camera,
    titulo: "1. Sube tu foto",
    texto: "Hazte una foto de la zona que te preocupa.",
  },
  {
    icono: Cpu,
    titulo: "2. IA analiza",
    texto: "Nuestro sistema de IA evalúa tu caso en segundos.",
  },
  {
    icono: FileText,
    titulo: "3. Recibe tu valoración",
    texto: "Te damos un informe gratuito con el diagnóstico.",
  },
  {
    icono: Mail,
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

  const { data: slidesData } = await supabase
    .from("hero_slides")
    .select("*")
    .eq("activo", true)
    .order("orden", { ascending: true });
  // Red de seguridad: si todavía no hay slides en BD (o las han
  // desactivado todas), la home no se queda sin hero.
  const slides =
    slidesData && slidesData.length > 0 ? slidesData : [SLIDE_POR_DEFECTO];

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
    <main className="flex-1">
      <AnnouncementBar />

      {/* Header + hero fundidos en un único bloque de color continuo.
          SiteHeader se pasa como children para que HeroCarousel pinte el
          color de la slide activa directamente por style de React, sin
          variables CSS de por medio (evita que se quede pegado a un
          color viejo si algo no sincroniza a tiempo). */}
      <HeroCarousel slides={slides}>
        <SiteHeader variant="dark" />
      </HeroCarousel>

      {/* Qué es Growwly */}
      <section className="mx-auto max-w-[1600px] px-6 py-8 sm:py-10">
        <div className="flex flex-col items-start gap-4 rounded-3xl bg-teal-dark px-6 py-8 sm:flex-row sm:items-center sm:gap-6 sm:px-10">
          <Image
            src="/brand/logo-h1.png"
            alt="Growwly"
            width={365}
            height={130}
            className="h-[61px] w-auto self-center sm:h-[68px] sm:self-auto"
          />
          <div className="hidden h-12 w-px bg-white/20 sm:block" aria-hidden />
          <h2 className="font-display text-xl font-bold text-white sm:text-2xl">
            Es el directorio{" "}
            <span className="inline-block bg-yellow px-1.5 text-teal-dark">
              Nº1
            </span>{" "}
            de clínicas y centros capilares verificados de España.
            Tratamientos, opiniones y precios reales.
          </h2>
        </div>
      </section>

      {/* Clínicas destacadas */}
      {destacadas.length > 0 && (
        <section className="border-t border-line">
          <div className="mx-auto max-w-[1600px] px-6 py-16">
            <h2 className="font-display text-4xl font-extrabold text-teal-dark">
              Clínicas destacadas
            </h2>
            <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {destacadas.map((clinic) => (
                <ClinicCard key={clinic.id} clinic={clinic} />
              ))}
            </div>
            <Link
              href="/clinicas"
              className="press mt-8 inline-block rounded-full bg-gradient-to-r from-brand-green to-brand-blue px-6 py-3 text-base font-medium text-teal-dark transition hover:opacity-90"
            >
              Ver todas las clínicas
            </Link>
          </div>
        </section>
      )}

      {clinicaDeLaSemana && <ClinicaDeLaSemana clinic={clinicaDeLaSemana} />}

      {/* Así de fácil */}
      <section id="como-funciona" className="mx-auto max-w-[1600px] px-6 py-8 sm:py-10">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-sage/50 via-sage/15 to-white px-6 py-10 sm:px-10 sm:py-14 lg:grid lg:grid-cols-[1fr_320px] lg:items-center lg:gap-12">
          <div>
            <h2 className="font-display text-4xl font-extrabold text-teal-dark">
              Así de fácil
            </h2>
            <p className="mt-3 max-w-md text-lg text-ink-soft">
              Tu valoración capilar en 4 sencillos pasos.
            </p>

            <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-4">
              {PASOS.map((paso, i) => {
                const Icono = paso.icono;
                return (
                  <div key={paso.titulo} className="relative">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-sage/70 text-teal-dark">
                      <Icono size={24} aria-hidden />
                    </div>
                    <h3 className="mt-4 font-display text-base font-bold text-teal-dark">
                      {paso.titulo}
                    </h3>
                    <p className="mt-1 text-sm text-ink-soft">{paso.texto}</p>
                    {i < PASOS.length - 1 && (
                      <span
                        aria-hidden
                        className="absolute -right-4 top-5 hidden text-xl font-bold text-cyan sm:block"
                      >
                        →
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="relative mt-16 hidden justify-self-center lg:flex">
            <svg
              aria-hidden
              viewBox="0 0 100 100"
              className="pointer-events-none absolute -right-8 -top-10 h-28 w-28 text-brand-green/60"
            >
              <path
                fill="currentColor"
                d="M50 5c25 5 40 25 35 50-4 20-22 35-40 32C25 84 8 65 8 45 8 22 27 0 50 5Z"
              />
              <path
                fill="currentColor"
                opacity="0.6"
                d="M70 30c14 6 20 20 15 34-4 12-16 20-28 17-10-3-18-14-16-27 2-14 15-28 29-24Z"
              />
            </svg>

            <div className="relative h-[340px] w-[180px] rounded-[2rem] border-[6px] border-teal-dark bg-white shadow-xl">
              <div className="relative h-full w-full overflow-hidden rounded-[1.4rem] bg-sage/40">
                <Image
                  src="/analisis/orientacion-trasera.png"
                  alt=""
                  fill
                  sizes="180px"
                  className="object-cover"
                />
              </div>
              <div className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-lg bg-teal-dark shadow-sm">
                <Sparkles size={16} className="text-yellow" aria-hidden />
              </div>
            </div>

            <div className="absolute -bottom-8 -left-12 w-52 rounded-2xl bg-white p-4 shadow-lg">
              <p className="text-sm font-bold text-teal-dark">Tu valoración</p>
              <p className="mt-1.5 flex items-center gap-1.5 text-xs text-ink-soft">
                <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-brand-green text-white">
                  <Check size={10} aria-hidden />
                </span>
                Sin coste · En 1 minuto
              </p>
            </div>
          </div>
        </div>
      </section>

      <TratamientosDestacados tratamientos={tratamientosDestacados} />

      {/* CTA clínicas */}
      <section className="bg-paper">
        <div className="mx-auto max-w-[1600px] px-6 py-14">
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
      </section>
      <SiteFooter />
    </main>
  );
}
