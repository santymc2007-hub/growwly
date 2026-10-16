import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { registrarClinica } from "./actions";
import { RegistroClinicaForm } from "./registro-clinica-form";
import { SiteHeader } from "@/components/site-header";
import { FondoTextura } from "@/components/fondo-textura";
import { SiteFooter } from "@/components/site-footer";
import { TarjetasPlanes } from "@/components/precios/tarjetas-planes";

export const metadata: Metadata = {
  title: "Únete a Growwly",
  description:
    "Publica tu centro capilar gratis en el directorio de Growwly, o pasa a Premium para recibir pacientes reales cada mes.",
  alternates: { canonical: "/clinica/registro" },
};

type SearchParams = { error?: string; clinic?: string; modo?: string };

export default async function RegistroClinicaPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { error, clinic, modo } = await searchParams;

  // Con la clave secreta: la lista de fichas que se pueden reclamar
  // incluye las no publicadas, que la clave pública ya no ve, y para
  // saber cuáles están ya reclamadas hay que leer perfiles de clínica.
  // Solo se pasan a la página id, nombre y ciudad.
  const supabase = createAdminClient();
  const { data: todasLasClinicas } = await supabase
    .from("clinics")
    .select("id, nombre, ciudad")
    .order("nombre", { ascending: true });

  const { data: aprobadas } = await supabase
    .from("profiles")
    .select("clinic_id")
    .eq("role", "clinic")
    .eq("clinic_status", "aprobado");

  const idsReclamados = new Set((aprobadas ?? []).map((p) => p.clinic_id));
  const clinicasDisponibles = (todasLasClinicas ?? []).filter(
    (c) => !idsReclamados.has(c.id),
  );

  return (
    <main className="relative flex-1">
      <FondoTextura />
      <SiteHeader />

      {/* Hero */}
      <div className="mx-auto max-w-[1400px] px-3 pt-3 sm:px-6">
        <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-teal-dark to-cyan-dark px-6 py-16 text-center text-white sm:px-10 sm:py-20">
          <div className="mx-auto flex max-w-xl flex-col items-center gap-4">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wide">
              ¿Tienes un centro capilar?
            </span>
            <h1 className="font-display text-4xl font-extrabold leading-tight sm:text-5xl">
              Únete a Growwly, gratis
            </h1>
            <p className="text-base leading-relaxed text-white/85 sm:text-lg">
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
                className="press inline-flex items-center gap-1.5 rounded-full border-2 border-white/50 px-6 py-3 text-base font-bold text-white transition hover:bg-white/10"
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
          <span className="mt-1 inline-flex items-center gap-2 rounded-lg border border-orange/40 bg-orange/10 px-3.5 py-2 text-sm text-[#8a5a00]">
            <AlertTriangle size={16} className="shrink-0" aria-hidden />
            Precios de ejemplo — pendientes de confirmar antes de publicar
          </span>
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
                clinicasDisponibles={clinicasDisponibles}
                clinicPreseleccionada={clinic ?? ""}
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
