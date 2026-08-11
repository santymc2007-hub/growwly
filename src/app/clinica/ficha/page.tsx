import Image from "next/image";
import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SiteHeader } from "@/components/site-header";
import { FichaClinicaForm } from "./ficha-clinica-form";
import { actualizarMiFicha, cambiarPublicacion } from "./actions";
import { ClinicaNav } from "../clinica-nav";

type SearchParams = { error?: string; guardado?: string };

export default async function FichaClinicaPage({
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
  const fotoPrincipal = clinic.fotos[0] ?? null;

  return (
    <main className="flex-1 bg-gradient-to-b from-sage/25 to-transparent">
      <SiteHeader />
      <div className="mx-auto max-w-3xl px-6 py-12">
        <div className="flex items-center gap-4">
          {fotoPrincipal ? (
            <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full border-2 border-white shadow">
              <Image src={fotoPrincipal} alt="" fill sizes="56px" className="object-cover" />
            </div>
          ) : (
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-sage text-lg font-bold text-sage-ink">
              {clinic.nombre.charAt(0)}
            </div>
          )}
          <div>
            <h1 className="font-display text-2xl text-teal-dark">
              {clinic.nombre}
            </h1>
            <p className="mt-0.5 text-sm text-ink-soft">{user.email}</p>
          </div>
        </div>

        <div className="mt-8">
          <ClinicaNav activo="ficha" />
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

        <div
          className={`mb-6 flex items-center justify-between rounded-2xl p-4 ${
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

        <FichaClinicaForm clinic={clinic} action={actualizarMiFicha} />
      </div>
    </main>
  );
}
