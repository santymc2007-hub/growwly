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
      <SiteHeader />

      {/* Héroe */}
      <section className="relative overflow-hidden bg-gradient-to-r from-white via-white to-sage/50">
        <div className="mx-auto grid max-w-[1600px] items-center gap-10 px-6 py-16 sm:py-20 lg:grid-cols-2 lg:gap-16">
          <div>
            <h1 className="font-display text-4xl leading-tight text-teal-dark sm:text-5xl">
              Tu{" "}
              <span className="inline-block bg-yellow px-2 text-teal-dark">
                valoración con IA
              </span>{" "}
              en un par de clics.
            </h1>
            <p className="mt-3 font-display text-2xl text-teal-dark sm:text-3xl">
              ¡Ah! Y con presupuesto personalizado.
            </p>

            <Link
              href="/analisis/nuevo"
              className="mt-8 inline-block rounded-full bg-gradient-to-r from-yellow to-orange px-8 py-4 text-base font-bold text-teal-dark shadow-lg shadow-orange/20 transition hover:opacity-90"
            >
              Subir fotos
            </Link>

            <p className="mt-4 text-sm text-ink-soft">
              Gratis · 2 minutos · No es un diagnóstico médico
            </p>
          </div>

          <div className="relative mx-auto aspect-[4/3] w-full max-w-lg">
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white to-sage/70 shadow-xl" />
            <div className="absolute inset-10 rounded-2xl border-2 border-dashed border-cyan/40" />
            <div className="absolute right-5 top-5 flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-teal-dark shadow-md">
              ✨ AI
            </div>
            <div className="absolute inset-0 flex items-center justify-center px-10 text-center text-sm text-ink-soft">
              Foto pendiente — aquí irá la imagen final
            </div>
          </div>
        </div>
      </section>

      {/* Cómo funciona */}
      <section id="como-funciona" className="mx-auto max-w-[1600px] px-6 py-16">
        <h2 className="font-display text-3xl text-teal-dark">
          ¿Cómo funciona Growwly?
        </h2>
        <p className="mt-2 max-w-2xl text-ink-soft">
          Un proceso simple y transparente que te conecta con las mejores
          clínicas especializadas en tratamientos capilares.
        </p>

        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {PASOS.map((paso, i) => {
            const Icono = paso.icono;
            return (
              <div key={paso.titulo} className="relative">
                <div className="h-full rounded-2xl border-2 border-sage bg-white p-6">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sage/60 text-teal-dark">
                    <Icono size={22} aria-hidden />
                  </div>
                  <h3 className="mt-4 font-display text-lg text-teal-dark">
                    {paso.titulo}
                  </h3>
                  <p className="mt-2 text-sm text-ink-soft">{paso.texto}</p>
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
            <h2 className="font-display text-3xl text-teal-dark">
              Clínicas destacadas
            </h2>
            <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {destacadas.map((clinic) => (
                <ClinicCard key={clinic.id} clinic={clinic} />
              ))}
            </div>
            <Link
              href="/clinicas"
              className="mt-8 inline-block rounded-full bg-teal px-6 py-3 text-sm font-medium text-paper transition hover:bg-teal-dark"
            >
              Ver todas las clínicas →
            </Link>
          </div>
        </section>
      )}

      {/* CTA clínicas */}
      <section className="border-t border-line bg-gradient-to-br from-sage/50 to-cyan/10">
        <div className="mx-auto flex max-w-[1600px] flex-col items-center gap-3 px-6 py-14 text-center">
          <p className="font-display text-2xl text-teal-dark">
            ¿Tienes una clínica capilar?
          </p>
          <p className="max-w-md text-sm text-ink-soft">
            Reclama tu ficha en el directorio y recibe solicitudes de
            presupuesto de pacientes reales.
          </p>
          <Link
            href="/clinica/registro"
            className="mt-2 inline-block rounded-full bg-teal px-6 py-3 text-sm font-medium text-paper transition hover:bg-teal-dark"
          >
            Únete como clínica →
          </Link>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
