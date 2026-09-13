import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { SiteHeader } from "@/components/site-header";
import { FichaClinicaForm } from "./ficha/ficha-clinica-form";
import { actualizarMiFicha, cambiarPublicacion } from "./ficha/actions";
import { ClinicaNav } from "./clinica-nav";
import { requireClinicaActiva } from "@/lib/clinica/contexto-activo";
import { SelectorClinica } from "@/components/clinica/selector-clinica";
import { ClinicaHeaderPerfil } from "@/components/clinica/clinica-header-perfil";
import { getMunicipiosYZonas } from "@/lib/clinica/geografia";
import { calcularCompletitud, mensajeCompletitud } from "@/lib/clinica/completitud";
import { contarSolicitudesPendientes } from "@/lib/clinica/solicitudes-pendientes";
import { obtenerNombreGestor } from "@/lib/clinica/perfil-gestor";
import { AvisoSolicitudesPendientes } from "@/components/clinica/aviso-solicitudes-pendientes";

type SearchParams = { error?: string; guardado?: string };

export default async function ClinicaPanelPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { error, guardado } = await searchParams;

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

  if (!profile || profile.role !== "clinic") {
    redirect("/cuenta");
  }

  // Cuenta todavía sin aprobar: pantalla de espera, usando el clinic_id
  // de referencia (aún no hay tabla de miembros con nada aprobado).
  if (profile.clinic_status !== "aprobado") {
    let clinica: { nombre: string } | null = null;
    if (profile.clinic_id) {
      const admin = createAdminClient();
      const { data } = await admin
        .from("clinics")
        .select("nombre")
        .eq("id", profile.clinic_id)
        .maybeSingle();
      clinica = data;
    }

    return (
      <main className="flex-1 bg-gradient-to-b from-sage/25 to-transparent">
        <SiteHeader />
        <div className="mx-auto max-w-lg px-6 py-12">
          <h1 className="font-display text-2xl text-teal-dark">
            {clinica?.nombre ?? "Panel de clínica"}
          </h1>
          <p className="mt-0.5 text-sm text-ink-soft">{user.email}</p>
          <div className="mt-8 rounded-2xl border border-dashed border-line bg-white p-6 text-center">
            <p className="font-display text-lg text-teal-dark">
              Cuenta pendiente de aprobación
            </p>
            <p className="mt-2 text-sm text-ink-soft">
              En cuanto confirmemos que representas a {clinica?.nombre ?? "esta clínica"},
              activaremos tu acceso completo al panel.
            </p>
          </div>
        </div>
      </main>
    );
  }

  const { clinicId, profileId, clinicas } = await requireClinicaActiva();

  const admin = createAdminClient();
  const { data: clinic } = await admin
    .from("clinics")
    .select("*")
    .eq("id", clinicId)
    .maybeSingle();

  if (!clinic) {
    notFound();
  }

  const { municipios, zonas } = await getMunicipiosYZonas();
  const solicitudesPendientes = await contarSolicitudesPendientes(clinicId);
  const nombreGestor = await obtenerNombreGestor(profileId);
  const fotoPrincipal = clinic.logo_url ?? clinic.fotos?.[0] ?? null;

  const publicarAction = cambiarPublicacion.bind(null, true);
  const darDeBajaAction = cambiarPublicacion.bind(null, false);

  const porcentaje = calcularCompletitud(clinic);

  return (
    <main className="flex-1 bg-gradient-to-b from-sage/25 to-transparent">
      <AvisoSolicitudesPendientes cantidad={solicitudesPendientes} />
      <SiteHeader />
      <div className="mx-auto max-w-[1200px] px-6 py-12">
        <ClinicaHeaderPerfil
          nombreClinica={clinic.nombre}
          fotoPrincipal={fotoPrincipal}
          email={user.email ?? ""}
          nombreGestor={nombreGestor}
        />

        <div className="mt-4">
          <SelectorClinica clinicas={clinicas} clinicaActivaId={clinicId} />
        </div>

        <div className="mt-4">
          <ClinicaNav activo="ficha" solicitudesPendientes={solicitudesPendientes} />
        </div>

        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-stretch">
          <div className="rounded-2xl border border-line bg-white p-4 md:w-[70%]">
            <div className="flex items-center justify-between gap-3 text-sm">
              <p className="font-medium text-ink">{mensajeCompletitud(porcentaje)}</p>
              <span className="shrink-0 font-display text-lg font-bold text-teal-dark">
                {porcentaje}%
              </span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-paper-dim">
              <div
                className="h-full rounded-full bg-gradient-to-r from-brand-green to-brand-blue transition-all"
                style={{ width: `${porcentaje}%` }}
              />
            </div>
            {clinic.plan !== "premium" && porcentaje < 100 && (
              <Link
                href="/clinica/visibilidad"
                className="mt-2 inline-block text-xs font-medium text-cyan-dark hover:underline"
              >
                Completa tu Perfil detallado para llegar al 100% →
              </Link>
            )}
          </div>

          <div
            className={`flex flex-col justify-center gap-3 rounded-2xl p-4 md:w-[30%] ${
              clinic.publicado ? "bg-sage" : "bg-paper-dim"
            }`}
          >
            <div>
              <p
                className={`text-sm font-medium ${clinic.publicado ? "text-sage-ink" : "text-ink"}`}
              >
                {clinic.publicado
                  ? "Tu ficha está visible en el directorio"
                  : "Tu ficha está de baja — no aparece en el directorio"}
              </p>
              <p className="mt-0.5 text-xs text-ink-soft">
                Puedes darla de baja o volver a publicarla cuando quieras; tus
                datos no se pierden.
              </p>
            </div>
            <form action={clinic.publicado ? darDeBajaAction : publicarAction}>
              <button
                type="submit"
                className={`rounded-full px-4 py-2 text-sm font-medium ${
                  clinic.publicado
                    ? "border border-error text-error hover:bg-error/10"
                    : "bg-teal text-paper hover:bg-teal-dark"
                }`}
              >
                {clinic.publicado ? "Dar de baja" : "Volver a publicar"}
              </button>
            </form>
          </div>
        </div>

        {guardado && (
          <p className="mb-4 rounded-lg bg-sage px-4 py-3 text-sm text-sage-ink">
            Cambios guardados.
          </p>
        )}
        {error && (
          <p className="mb-4 rounded-lg bg-error/10 px-4 py-3 text-sm text-error-dark">
            {decodeURIComponent(error)}
          </p>
        )}

        <FichaClinicaForm
          clinic={clinic}
          nombreGestor={nombreGestor}
          action={actualizarMiFicha}
          municipios={municipios}
          zonas={zonas}
        />
      </div>
    </main>
  );
}
