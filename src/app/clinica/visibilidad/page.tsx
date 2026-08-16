import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { SiteHeader } from "@/components/site-header";
import { ClinicaNav } from "../clinica-nav";
import { TarjetaVisibilidad } from "./tarjeta-visibilidad";
import { requireClinicaActiva } from "@/lib/clinica/contexto-activo";
import { SelectorClinica } from "@/components/clinica/selector-clinica";
import { slugifyCiudad, slugifyProvincia } from "@/lib/clinic-options";

type SearchParams = { solicitud?: string };

export default async function VisibilidadPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { solicitud } = await searchParams;

  const { clinicId, clinicas } = await requireClinicaActiva();

  const supabase = createAdminClient();
  const { data: clinic } = await supabase
    .from("clinics")
    .select("*")
    .eq("id", clinicId)
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

        <div className="mt-4">
          <SelectorClinica clinicas={clinicas} clinicaActivaId={clinicId} />
        </div>

        <div className="mt-4">
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

        {(() => {
          const fechas =
            clinic.visibilidad_fechas &&
            typeof clinic.visibilidad_fechas === "object" &&
            !Array.isArray(clinic.visibilidad_fechas)
              ? (clinic.visibilidad_fechas as Record<
                  string,
                  { expira_en?: string | null }
                >)
              : {};

          const rutaCiudad = clinic.ciudad
            ? `/clinicas/${slugifyProvincia(clinic.provincia)}/${slugifyCiudad(clinic.ciudad)}`
            : "tu ciudad";

          return (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <TarjetaVisibilidad
                tipo="destacado"
                icono="★"
                titulo="Destacada en el listado"
                descripcion="Tu ficha resalta con color y sube de posición en /clinicas."
                activo={clinic.destacado}
                pendiente={clinic.destacado_solicitado}
                expiraEn={fechas.destacado?.expira_en}
              />
              <TarjetaVisibilidad
                tipo="destacado_home"
                icono="🏠"
                titulo="Destacada en la Home"
                descripcion='Apareces en la sección "Clínicas destacadas" de la página principal.'
                activo={clinic.destacado_home}
                pendiente={clinic.destacado_home_solicitado}
                expiraEn={fechas.destacado_home?.expira_en}
              />
              <TarjetaVisibilidad
                tipo="destacado_ciudad"
                icono="📍"
                titulo="Destacada en tu ciudad"
                descripcion={`Resaltas al principio dentro de ${rutaCiudad}.`}
                activo={clinic.destacado_ciudad}
                pendiente={clinic.destacado_ciudad_solicitado}
                expiraEn={fechas.destacado_ciudad?.expira_en}
              />
              <TarjetaVisibilidad
                tipo="premium"
                icono="✦"
                titulo="Perfil detallado"
                descripcion="Fotos antes/después, opiniones, certificados, contacto directo y más en tu ficha."
                activo={clinic.plan === "premium"}
                pendiente={clinic.plan_solicitado === "premium"}
                expiraEn={fechas.premium?.expira_en}
              />
            </div>
          );
        })()}
      </div>
    </main>
  );
}
