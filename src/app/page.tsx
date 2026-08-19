import Image from "next/image";
import Link from "next/link";
import { ScanSearch, Send, FileCheck2, CalendarCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ClinicCard } from "@/components/clinics/clinic-card";
import { ClinicaDeLaSemana } from "@/components/clinics/clinica-de-la-semana";
import { obtenerClinicaDeLaSemana } from "@/lib/clinica/clinica-de-la-semana";
import { HeroCarousel } from "@/components/home/hero-carousel";
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
  color_fondo: "#ecf7f1",
  imagen_url: "/brand/hero-persona.png",
  enlace: "/analisis/nuevo",
  texto_boton: "Subir fotos",
  activo: true,
  created_at: "",
  updated_at: "",
};

const PASOS = [
  {
    icono: ScanSearch,
    titulo: "Evaluación inicial",
    texto: "Completa tu perfil y sube fotos para una evaluación personalizada.",
  },
  {
    icono: Send,
    titulo: "Solicita propuesta",
    texto: "Enviamos tu evaluación a las clínicas que se adaptan a tus necesidades.",
  },
  {
    icono: FileCheck2,
    titulo: "Recibe ofertas",
    texto: "Las clínicas te envían propuestas adaptadas a tus necesidades.",
  },
  {
    icono: CalendarCheck,
    titulo: "Reserva tu cita",
    texto: "Elige la mejor opción y agenda tu intervención de forma segura.",
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
      {/* Cabecera sobre fondo blanco (ya no superpuesta al hero) */}
      <SiteHeader />

      {/* Héroe: carrusel en tarjeta redondeada con márgenes respecto al borde de página */}
      <section className="mx-auto max-w-[1600px] px-6 pt-2 sm:pt-4">
        <HeroCarousel slides={slides} />
      </section>

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

      {/* Cómo funciona */}
      <section id="como-funciona" className="mx-auto max-w-[1600px] px-6 py-16">
        <h2 className="font-display text-4xl font-extrabold text-teal-dark">
          ¿Cómo funciona la valoración capilar con IA?
        </h2>
        <p className="mt-3 max-w-2xl text-lg text-ink-soft">
          Un proceso simple y transparente que te conecta con las mejores
          clínicas especializadas en tratamientos capilares.
        </p>

        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {PASOS.map((paso, i) => {
            const Icono = paso.icono;
            return (
              <div key={paso.titulo} className="relative">
                <div className="h-full rounded-2xl border-2 border-sage bg-white p-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sage/60 text-teal-dark">
                    <Icono size={24} aria-hidden />
                  </div>
                  <h3 className="mt-4 font-display text-xl font-bold text-teal-dark">
                    {paso.titulo}
                  </h3>
                  <p className="mt-2 text-base text-ink-soft">{paso.texto}</p>
                </div>
                {i < PASOS.length - 1 && (
                  <span
                    aria-hidden
                    className="absolute -right-4 top-1/2 z-10 hidden h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-cyan text-lg font-bold text-white lg:flex"
                  >
                    ›
                  </span>
                )}
              </div>
            );
          })}
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
