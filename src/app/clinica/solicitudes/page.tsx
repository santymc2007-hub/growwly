import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SiteHeader } from "@/components/site-header";
import { ClinicaNav } from "../clinica-nav";

const ESTADO_LABEL: Record<string, string> = {
  enviado: "Nuevo",
  visto: "Visto",
  desbloqueado: "Desbloqueado",
};

export default async function SolicitudesClinicaPage() {
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
    // Sin aprobar (o sin perfil de clínica): la pantalla de "pendiente"
    // vive en la ficha (/clinica), que es donde ahora se aterriza siempre.
    redirect("/clinica");
  }

  const { data: leads } = await supabase
    .from("leads_clinica")
    .select("*")
    .eq("clinic_id", profile.clinic_id)
    .order("enviado_en", { ascending: false });

  return (
    <main className="flex-1 bg-gradient-to-b from-sage/25 to-transparent">
      <SiteHeader />
      <div className="mx-auto max-w-[1200px] px-6 py-12">
        <div className="mt-0">
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
