import { notFound } from "next/navigation";
import { Home, MapPin, Gem } from "lucide-react";
import {
  BENEFICIO_LABEL,
  CAMPANA_LABEL,
  DESCRIPCION_LABEL,
  TIPO_LABEL,
  plazasDestacado,
} from "@/lib/visibilidad/destacados";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { SiteHeader } from "@/components/site-header";
import { ClinicaNav } from "../clinica-nav";
import { SeccionVisibilidad } from "./seccion-visibilidad";
import { EsquemaVisibilidad } from "./esquema-visibilidad";
import { requireClinicaActiva } from "@/lib/clinica/contexto-activo";
import { SelectorClinica } from "@/components/clinica/selector-clinica";
import { ClinicaHeaderPerfil } from "@/components/clinica/clinica-header-perfil";
import { contarSolicitudesPendientes } from "@/lib/clinica/solicitudes-pendientes";
import { obtenerNombreGestor } from "@/lib/clinica/perfil-gestor";

type SearchParams = { solicitud?: string; completo?: string };

export default async function VisibilidadPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { solicitud, completo } = await searchParams;

  const { clinicId, profileId, clinicas } = await requireClinicaActiva();

  const authSupabase = await createClient();
  const {
    data: { user },
  } = await authSupabase.auth.getUser();

  const supabase = createAdminClient();
  const { data: clinic } = await supabase
    .from("clinics")
    .select("*")
    .eq("id", clinicId)
    .maybeSingle();

  if (!clinic) {
    notFound();
  }

  const [plazasGeneral, plazasProvincia] = await Promise.all([
    plazasDestacado(supabase, "destacado", null),
    plazasDestacado(supabase, "destacado_provincia", clinic.provincia),
  ]);

  const solicitudesPendientes = await contarSolicitudesPendientes(clinicId);
  const nombreGestor = await obtenerNombreGestor(profileId);
  const fotoPrincipal = clinic.logo_url ?? clinic.fotos?.[0] ?? null;

  return (
    <main className="flex-1 bg-gradient-to-b from-sage/25 to-transparent">
      <SiteHeader />
      <div className="mx-auto max-w-[1200px] px-6 py-12">
        <ClinicaHeaderPerfil
          nombreClinica={clinic.nombre}
          fotoPrincipal={fotoPrincipal}
          email={user?.email ?? ""}
          nombreGestor={nombreGestor}
        />

        <div className="mt-4">
          <SelectorClinica clinicas={clinicas} clinicaActivaId={clinicId} />
        </div>

        <div className="mt-4">
          <ClinicaNav activo="visibilidad" solicitudesPendientes={solicitudesPendientes} />
        </div>

        {solicitud && (
          <p className="mb-4 rounded-lg bg-sage px-4 py-3 text-sm text-sage-ink">
            Solicitud enviada — te avisaremos en cuanto se active.
          </p>
        )}
        {completo && (
          <p className="mb-4 rounded-lg bg-orange/15 px-4 py-3 text-sm text-ink">
            Ya no quedan plazas libres para ese destacado. Escríbenos y te avisamos
            en cuanto se libere una.
          </p>
        )}

        <div className="mb-8 mt-2 max-w-2xl">
          <h1 className="font-display text-[28px] font-extrabold leading-tight text-teal-dark">
            Haz que te vean más pacientes
          </h1>
          <p className="mt-2 text-base text-ink-soft">
            Cada opción se solicita por separado y la activamos nosotros. Las
            plazas de destacado son limitadas: cuando se llenan, no se pueden
            pedir más hasta que se libere una.
          </p>
        </div>

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

          return (
            <SeccionVisibilidad
              premium={{
                tipo: "premium",
                icono: <Gem className="h-6 w-6" strokeWidth={2.2} />,
                titulo: TIPO_LABEL.premium,
                descripcion: DESCRIPCION_LABEL.premium,
                beneficio: BENEFICIO_LABEL.premium,
                activo: clinic.plan === "premium",
                pendiente: clinic.plan_solicitado === "premium",
                expiraEn: fechas.premium?.expira_en,
                campana: CAMPANA_LABEL.premium,
                esquema: <EsquemaVisibilidad tipo="premium" />,
              }}
              destacados={[
                {
                  tipo: "destacado",
                  icono: <Home className="h-5 w-5" strokeWidth={2.2} />,
                  titulo: TIPO_LABEL.destacado,
                  descripcion: DESCRIPCION_LABEL.destacado,
                  beneficio: BENEFICIO_LABEL.destacado,
                  activo: clinic.destacado,
                  pendiente: clinic.destacado_solicitado,
                  expiraEn: fechas.destacado?.expira_en,
                  plazas: plazasGeneral,
                  campana: CAMPANA_LABEL.destacado,
                  esquema: <EsquemaVisibilidad tipo="destacado" />,
                },
                {
                  tipo: "destacado_provincia",
                  icono: <MapPin className="h-5 w-5" strokeWidth={2.2} />,
                  titulo: TIPO_LABEL.destacado_provincia,
                  descripcion: DESCRIPCION_LABEL.destacado_provincia,
                  beneficio: BENEFICIO_LABEL.destacado_provincia,
                  activo: clinic.destacado_provincia,
                  pendiente: clinic.destacado_provincia_solicitado,
                  expiraEn: fechas.destacado_provincia?.expira_en,
                  plazas: plazasProvincia,
                  campana: CAMPANA_LABEL.destacado_provincia,
                  esquema: (
                    <EsquemaVisibilidad tipo="destacado_provincia" provincia={clinic.provincia} />
                  ),
                },
              ]}
            />
          );
        })()}
      </div>
    </main>
  );
}
