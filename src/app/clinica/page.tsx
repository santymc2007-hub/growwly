import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SiteHeader } from "@/components/site-header";
import { ClinicaNav } from "./clinica-nav";

const ESTADO_LABEL: Record<string, string> = {
  enviado: "Nuevo",
  visto: "Visto",
  desbloqueado: "Desbloqueado",
};

export default async function ClinicaPanelPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/clinica/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || profile.role !== "clinic") {
    redirect("/cuenta");
  }

  let clinica: { nombre: string; fotos: string[] } | null = null;
  if (profile.clinic_id) {
    const { data } = await supabase
      .from("clinics")
      .select("nombre, fotos")
      .eq("id", profile.clinic_id)
      .maybeSingle();
    clinica = data;
  }

  const fotoPrincipal = clinica?.fotos?.[0] ?? null;

  const cabecera = (
    <div className="flex items-center gap-4">
      {fotoPrincipal ? (
        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full border-2 border-white shadow">
          <Image src={fotoPrincipal} alt="" fill sizes="56px" className="object-cover" />
        </div>
      ) : (
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-sage text-lg font-bold text-sage-ink">
          {(clinica?.nombre ?? "?").charAt(0)}
        </div>
      )}
      <div>
        <h1 className="font-display text-2xl text-teal-dark">
          {clinica?.nombre ?? "Panel de clínica"}
        </h1>
        <p className="mt-0.5 text-sm text-ink-soft">{user.email}</p>
      </div>
    </div>
  );

  if (profile.clinic_status !== "aprobado") {
    return (
      <main className="flex-1 bg-gradient-to-b from-sage/25 to-transparent">
        <SiteHeader />
        <div className="mx-auto max-w-lg px-6 py-12">
          {cabecera}
          <div className="mt-8 rounded-2xl border border-dashed border-line bg-white p-6 text-center">
            <p className="font-display text-lg text-teal-dark">
              Cuenta pendiente de aprobación
            </p>
            <p className="mt-2 text-sm text-ink-soft">
              En cuanto confirmemos que representas a {clinica?.nombre ?? "esta clínica"},
              activaremos tu acceso a las solicitudes de presupuesto.
            </p>
          </div>
        </div>
      </main>
    );
  }

  const { data: leads } = await supabase
    .from("leads_clinica")
    .select("*")
    .eq("clinic_id", profile.clinic_id!)
    .order("enviado_en", { ascending: false });

  return (
    <main className="flex-1 bg-gradient-to-b from-sage/25 to-transparent">
      <SiteHeader />
      <div className="mx-auto max-w-3xl px-6 py-12">
        {cabecera}
        <div className="mt-8">
          <ClinicaNav activo="solicitudes" />
        </div>

        <h2 className="font-display text-lg text-teal-dark">
          Solicitudes de presupuesto
        </h2>

        {leads && leads.length > 0 ? (
          <ul className="mt-4 flex flex-col gap-2">
            {leads.map((lead) => (
              <li key={lead.id}>
                <Link
                  href={`/leads/${lead.token}`}
                  className="flex items-center justify-between rounded-xl border border-line bg-white px-4 py-3 text-sm hover:border-teal/40"
                >
                  <span className="text-ink">
                    {new Date(lead.enviado_en).toLocaleDateString("es-ES")}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                      lead.estado === "enviado"
                        ? "bg-cyan text-white"
                        : "bg-paper-dim text-ink-soft"
                    }`}
                  >
                    {ESTADO_LABEL[lead.estado] ?? lead.estado}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-ink-soft">
            Todavía no tienes solicitudes de presupuesto.
          </p>
        )}
      </div>
    </main>
  );
}
