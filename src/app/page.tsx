import Image from "next/image";
import Link from "next/link";
import { ScanSearch, Send, FileCheck2, CalendarCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ClinicCard } from "@/components/clinics/clinic-card";

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
    .order("destacado", { ascending: false })
    .order("orden", { ascending: true })
    .limit(4);
  const destacadas = data ?? [];

  return (
    <main className="flex-1">
      {/* Héroe (incluye la cabecera dentro, para que el degradado se vea detrás del menú) */}
      <section
        className="relative overflow-hidden bg-cover bg-center"
        style={{ backgroundImage: "url(/brand/fondo-hero.png)" }}
      >
        <SiteHeader />
        <div className="mx-auto grid max-w-[1600px] items-end gap-6 px-6 pt-4 sm:pt-10 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="self-center text-left">
            <h1 className="font-display text-2xl font-extrabold leading-tight text-teal-dark sm:text-5xl lg:text-6xl">
              Tu{" "}
              <span className="inline-block bg-yellow px-2 text-teal-dark">
                valoración con IA
              </span>{" "}
              en un par de clics.
            </h1>
            <p className="mt-2 font-display text-lg font-bold text-teal-dark sm:mt-4 sm:text-3xl lg:text-4xl">
              ¡Ah! Y con presupuesto personalizado.
            </p>

            <Link
              href="/analisis/nuevo"
              className="mt-4 inline-block w-full max-w-xs rounded-full bg-gradient-to-r from-yellow to-orange px-6 py-3 font-display text-base font-bold text-teal-dark shadow-lg shadow-orange/20 transition hover:opacity-90 sm:mt-8 sm:max-w-md sm:px-8 sm:py-5 sm:text-xl"
            >
              Subir fotos
            </Link>

            <p className="mt-3 text-xs text-ink-soft sm:mt-4 sm:text-base">
              Gratis · 2 minutos · No es un diagnóstico médico
            </p>
          </div>

          <div className="relative mx-auto aspect-[1114/889] w-full max-w-[440px] self-end sm:max-w-none">
            <Image
              src="/brand/hero-persona.png"
              alt="Persona haciéndose una foto para el análisis capilar"
              fill
              sizes="(min-width: 1024px) 900px, 60vw"
              className="object-contain object-bottom"
              priority
            />
          </div>
        </div>
      </section>

      {/* Cómo funciona */}
      <section id="como-funciona" className="mx-auto max-w-[1600px] px-6 py-16">
        <h2 className="font-display text-4xl font-extrabold text-teal-dark">
          ¿Cómo funciona Growwly?
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

      {/* Clínicas destacadas */}
      {destacadas.length > 0 && (
        <section className="border-t border-line bg-paper-dim">
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
              className="mt-8 inline-block rounded-full bg-teal px-6 py-3 text-base font-medium text-paper transition hover:bg-teal-dark"
            >
              Ver todas las clínicas →
            </Link>
          </div>
        </section>
      )}

      {/* CTA clínicas */}
      <section className="border-t border-line bg-gradient-to-br from-sage/50 to-cyan/10">
        <div className="mx-auto flex max-w-[1600px] flex-col items-center gap-3 px-6 py-14 text-center">
          <p className="font-display text-3xl font-bold text-teal-dark">
            ¿Tienes una clínica capilar?
          </p>
          <p className="max-w-md text-base text-ink-soft">
            Reclama tu ficha en el directorio y recibe solicitudes de
            presupuesto de pacientes reales.
          </p>
          <Link
            href="/clinica/registro"
            className="mt-2 inline-block rounded-full bg-teal px-6 py-3 text-base font-medium text-paper transition hover:bg-teal-dark"
          >
            Únete como clínica →
          </Link>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
