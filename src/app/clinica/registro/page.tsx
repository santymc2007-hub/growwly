import type { Metadata } from "next";
import Link from "next/link";
import { clinicaReclamable } from "@/lib/clinica/reclamables";
import { registrarClinica } from "./actions";
import { RegistroClinicaForm } from "./registro-clinica-form";
import { SiteHeader } from "@/components/site-header";
import { FondoTextura } from "@/components/fondo-textura";
import { SiteFooter } from "@/components/site-footer";
import { TarjetasPlanes } from "@/components/precios/tarjetas-planes";

export const metadata: Metadata = {
  title: "Da de alta tu clínica capilar gratis",
  description:
    "Da de alta o reclama la ficha de tu clínica capilar en Growwly. Gratis, en pocos minutos, y con la opción de recibir solicitudes de pacientes de tu zona.",
  alternates: { canonical: "/clinica/registro" },
};

type SearchParams = { error?: string; clinic?: string; modo?: string };

export default async function RegistroClinicaPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { error, clinic, modo } = await searchParams;

  // Ya no se carga la lista entera de fichas: el campo "Tu clínica" busca
  // mientras se escribe (ver buscador-clinica.tsx). Solo hace falta la
  // ficha preseleccionada cuando se llega desde "Reclama este centro", y
  // únicamente si de verdad se puede reclamar (publicada y sin gestor).
  const preseleccionada = clinic ? await clinicaReclamable(clinic) : null;

  return (
    <main className="relative flex-1">
      <FondoTextura />
      <SiteHeader />

      {/* Hero */}
      <div className="mx-auto max-w-[1400px] px-3 pt-3 sm:px-6">
        {/* Sin caja de fondo: textos y botones sobre el fondo de la página. */}
        <div className="px-6 py-12 text-center text-teal-dark sm:px-10 sm:py-16">
          <div className="mx-auto flex max-w-xl flex-col items-center gap-4">
            <span className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-teal-dark shadow-sm">
              ¿Tienes un centro capilar?
            </span>
            <h1 className="font-display text-4xl font-extrabold leading-tight sm:text-5xl">
              Únete a Growwly, gratis
            </h1>
            <p className="text-base leading-relaxed text-ink-soft sm:text-lg">
              Llega a miles de personas que buscan el mejor tratamiento
              capilar. Publica tu ficha sin coste y, cuando quieras, pasa a
              Premium para recibir pacientes reales cada mes.
            </p>
            <div className="mt-2 flex flex-wrap justify-center gap-3">
              <a
                href="#crear-cuenta"
                className="press inline-block rounded-full bg-yellow px-7 py-3 font-display text-base font-bold text-teal-dark shadow-lg shadow-yellow/30 transition hover:opacity-90"
              >
                Crear mi cuenta gratis
              </a>
              <a
                href="#planes"
                className="press inline-flex items-center gap-1.5 rounded-full border-2 border-yellow bg-white/60 px-6 py-3 text-base font-bold text-teal-dark transition hover:bg-yellow/10"
              >
                Ver planes y precios ↓
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Planes */}
      <div id="planes" className="mx-auto max-w-[1400px] scroll-mt-6 px-3 pb-2 pt-14 sm:px-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="text-xs font-bold uppercase tracking-wide text-ink-soft">
            Planes para centros
          </span>
          <h2 className="max-w-md font-display text-3xl font-extrabold text-teal-dark sm:text-4xl">
            Elige cómo quieres aparecer
          </h2>
        </div>

        <div className="mt-10">
          <TarjetasPlanes hrefBasico="#crear-cuenta" />
        </div>

        <p className="mt-6 text-center text-sm text-ink-soft">
          <Link href="/precios" className="font-semibold text-cyan hover:text-cyan-dark">
            Ver la comparativa completa de planes →
          </Link>
        </p>
      </div>

      {/* Crear cuenta */}
      <div
        id="crear-cuenta"
        className="mx-auto max-w-[1400px] scroll-mt-6 px-3 pb-10 pt-16 sm:px-6"
      >
        <div className="overflow-hidden rounded-3xl bg-white shadow-sm">
          <div className="flex flex-col items-center px-6 py-14 text-center sm:px-10 sm:py-16">
            <span className="text-xs font-bold uppercase tracking-wide text-ink-soft">
              Último paso
            </span>
            <h2 className="mt-2 font-display text-3xl font-extrabold text-teal-dark sm:text-4xl">
              Crea tu cuenta gratis
            </h2>
            <p className="mt-2 max-w-sm text-sm text-ink-soft">
              Reclama la ficha de tu centro si ya está en el directorio, o
              crea una nueva si todavía no aparece. Tarda dos minutos — tu
              cuenta quedará pendiente de aprobación antes de activarse.
            </p>

            <div className="mt-8 w-full max-w-sm rounded-2xl border border-line bg-paper-dim/40 p-8 text-left">
              <RegistroClinicaForm
                action={registrarClinica}
                clinicPreseleccionada={preseleccionada}
                modoInicial={modo === "nueva" ? "nueva" : "existente"}
                error={error ? decodeURIComponent(error) : null}
              />
            </div>

            <p className="mt-6 text-sm text-ink-soft">
              ¿Ya tienes cuenta?{" "}
              <Link
                href="/clinica/login"
                className="font-medium text-cyan hover:text-cyan-dark"
              >
                Inicia sesión
              </Link>
            </p>
          </div>
        </div>
      </div>

      <SiteFooter />
    </main>
  );
}
