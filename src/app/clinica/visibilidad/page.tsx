import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SiteHeader } from "@/components/site-header";
import { ClinicaNav } from "../clinica-nav";
import { TarjetaVisibilidad } from "./tarjeta-visibilidad";
import {
  solicitarDestacadoListado,
  solicitarDestacadoHome,
  solicitarDestacadoCiudad,
  solicitarPremium,
} from "./actions";

type SearchParams = { solicitud?: string };

export default async function VisibilidadPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { solicitud } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/clinica/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, clinic_id, clinic_status")
    .eq("id", user.id)
    .maybeSingle();

  if (
    !profile ||
    profile.role !== "clinic" ||
    profile.clinic_status !== "aprobado" ||
    !profile.clinic_id
  ) {
    redirect("/clinica");
  }

  const { data: clinic } = await supabase
    .from("clinics")
    .select("*")
    .eq("id", profile.clinic_id)
    .maybeSingle();

  if (!clinic) {
    notFound();
  }

  return (
    <main className="flex-1 bg-gradient-to-b from-sage/25 to-transparent">
      <SiteHeader />
      <div className="mx-auto max-w-[1200px] px-6 py-12">
        <h1 className="font-display text-2xl text-teal-dark">
          {clinic.nombre}
        </h1>

        <div className="mt-8">
          <ClinicaNav activo="visibilidad" />
        </div>

        {solicitud && (
          <p className="mb-4 rounded-lg bg-sage px-4 py-3 text-sm text-sage-ink">
            Solicitud enviada — te avisaremos en cuanto se active.
          </p>
        )}

        <p className="mb-6 max-w-lg text-sm text-ink-soft">
          Formas de que tu clínica se vea más — cada una se solicita por
          separado y queda pendiente de aprobación antes de activarse.
        </p>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TarjetaVisibilidad
            icono="★"
            titulo="Destacada en el listado"
            descripcion="Tu ficha resalta con color y sube de posición en /clinicas."
            activo={clinic.destacado}
            pendiente={clinic.destacado_solicitado}
            action={solicitarDestacadoListado}
          />
          <TarjetaVisibilidad
            icono="🏠"
            titulo="Destacada en la Home"
            descripcion='Apareces en la sección "Clínicas destacadas" de la página principal.'
            activo={clinic.destacado_home}
            pendiente={clinic.destacado_home_solicitado}
            action={solicitarDestacadoHome}
          />
          <TarjetaVisibilidad
            icono="📍"
            titulo="Destacada en tu ciudad"
            descripcion={`Resaltas al principio dentro de /clinicas/${clinic.ciudad ? clinic.ciudad.toLowerCase() : "tu-ciudad"}.`}
            activo={clinic.destacado_ciudad}
            pendiente={clinic.destacado_ciudad_solicitado}
            action={solicitarDestacadoCiudad}
          />
          <TarjetaVisibilidad
            icono="✦"
            titulo="Plan Premium"
            descripcion="Fotos antes/después, opiniones, certificados, contacto directo y más en tu ficha."
            activo={clinic.plan === "premium"}
            pendiente={clinic.plan_solicitado === "premium"}
            action={solicitarPremium}
          />
        </div>
      </div>
    </main>
  );
}
