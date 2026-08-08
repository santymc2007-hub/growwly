import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SiteHeader } from "@/components/site-header";
import { cerrarSesionClinica } from "./actions";
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

  let nombreClinica: string | null = null;
  if (profile.clinic_id) {
    const { data: clinica } = await supabase
      .from("clinics")
      .select("nombre")
      .eq("id", profile.clinic_id)
      .maybeSingle();
    nombreClinica = clinica?.nombre ?? null;
  }

  const cabecera = (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="font-display text-2xl text-teal-dark">
          {nombreClinica ?? "Panel de clínica"}
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
  );

  if (profile.clinic_status !== "aprobado") {
    return (
      <main className="flex-1">
        <SiteHeader />
        <div className="mx-auto max-w-lg px-6 py-12">
          {cabecera}
          <div className="mt-8 rounded-xl border border-dashed border-line bg-white p-6 text-center">
            <p className="font-display text-lg text-teal-dark">
              Cuenta pendiente de aprobación
            </p>
            <p className="mt-2 text-sm text-ink-soft">
              En cuanto confirmemos que representas a {nombreClinica ?? "esta clínica"},
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
    <main className="flex-1">
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
                  className="flex items-center justify-between rounded-lg border border-line bg-white px-4 py-3 text-sm hover:border-teal/40"
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
