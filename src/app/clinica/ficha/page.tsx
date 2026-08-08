import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SiteHeader } from "@/components/site-header";
import { FichaClinicaForm } from "./ficha-clinica-form";
import { actualizarMiFicha, cambiarPublicacion, solicitarDestacado, solicitarPremium } from "./actions";
import { ClinicaNav } from "../clinica-nav";
import { cerrarSesionClinica } from "../actions";

type SearchParams = { error?: string; guardado?: string; solicitud?: string };

export default async function FichaClinicaPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { error, guardado, solicitud } = await searchParams;

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

  const publicarAction = cambiarPublicacion.bind(null, true);
  const darDeBajaAction = cambiarPublicacion.bind(null, false);

  return (
    <main className="flex-1">
      <SiteHeader />
      <div className="mx-auto max-w-3xl px-6 py-12">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl text-teal-dark">
              {clinic.nombre}
            </h1>
            <p className="mt-1 text-sm text-ink-soft">{user.email}</p>
          </div>
          <form action={cerrarSesionClinica}>
            <button
              type="submit"
              className="text-sm font-medium text-ink-soft hover:text-error"
            >
              Cerrar sesión
            </button>
          </form>
        </div>

        <div className="mt-8">
          <ClinicaNav activo="ficha" />
        </div>

        {guardado && (
          <p className="mb-4 rounded-lg bg-sage px-4 py-3 text-sm text-sage-ink">
            Cambios guardados.
          </p>
        )}
        {solicitud && (
          <p className="mb-4 rounded-lg bg-sage px-4 py-3 text-sm text-sage-ink">
            Solicitud enviada — te avisaremos en cuanto se active.
          </p>
        )}
        {error && (
          <p className="mb-4 rounded-lg bg-error/10 px-4 py-3 text-sm text-error-dark">
            {decodeURIComponent(error)}
          </p>
        )}

        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-line bg-white p-4">
            <p className="font-display text-base text-teal-dark">
              ★ Destacado
            </p>
            <p className="mt-1 text-sm text-ink-soft">
              Tu ficha resalta con color en el listado y sube de posición.
            </p>
            {clinic.destacado ? (
              <span className="mt-3 inline-block rounded-full bg-teal px-3 py-1 text-xs font-medium text-paper">
                Activo
              </span>
            ) : clinic.destacado_solicitado ? (
              <span className="mt-3 inline-block rounded-full bg-paper-dim px-3 py-1 text-xs font-medium text-ink-soft">
                Pendiente de aprobación
              </span>
            ) : (
              <form action={solicitarDestacado}>
                <button
                  type="submit"
                  className="mt-3 rounded-lg bg-teal px-4 py-2 text-sm font-medium text-paper hover:bg-teal-dark"
                >
                  Solicitar destacado
                </button>
              </form>
            )}
          </div>

          <div className="rounded-xl border border-line bg-white p-4">
            <p className="font-display text-base text-teal-dark">
              ✦ Plan Premium
            </p>
            <p className="mt-1 text-sm text-ink-soft">
              Muestra fotos antes/después, opiniones, certificados, tu
              contacto directo y más.
            </p>
            {clinic.plan === "premium" ? (
              <span className="mt-3 inline-block rounded-full bg-teal px-3 py-1 text-xs font-medium text-paper">
                Activo
              </span>
            ) : clinic.plan_solicitado === "premium" ? (
              <span className="mt-3 inline-block rounded-full bg-paper-dim px-3 py-1 text-xs font-medium text-ink-soft">
                Pendiente de aprobación
              </span>
            ) : (
              <form action={solicitarPremium}>
                <button
                  type="submit"
                  className="mt-3 rounded-lg bg-teal px-4 py-2 text-sm font-medium text-paper hover:bg-teal-dark"
                >
                  Solicitar Premium
                </button>
              </form>
            )}
          </div>
        </div>

        <div
          className={`mb-6 flex items-center justify-between rounded-xl p-4 ${
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
              className={`rounded-lg px-4 py-2 text-sm font-medium ${
                clinic.publicado
                  ? "border border-error text-error hover:bg-error/10"
                  : "bg-teal text-paper hover:bg-teal-dark"
              }`}
            >
              {clinic.publicado ? "Dar de baja" : "Volver a publicar"}
            </button>
          </form>
        </div>

        <FichaClinicaForm clinic={clinic} action={actualizarMiFicha} />
      </div>
    </main>
  );
}
