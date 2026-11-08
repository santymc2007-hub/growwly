import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { MenuLateral } from "./menu-lateral";

export const dynamic = "force-dynamic";

export default async function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createAdminClient();
  const { count: pendientes } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("role", "clinic")
    .eq("clinic_status", "pendiente");

  const { count: solicitudesDestacado } = await supabase
    .from("clinics")
    .select("id", { count: "exact", head: true })
    .eq("destacado_solicitado", true);
  const { count: solicitudesProvincia } = await supabase
    .from("clinics")
    .select("id", { count: "exact", head: true })
    .eq("destacado_provincia_solicitado", true);
  const { count: solicitudesPremium } = await supabase
    .from("clinics")
    .select("id", { count: "exact", head: true })
    .not("plan_solicitado", "is", null);
  const totalSolicitudes =
    (solicitudesDestacado ?? 0) +
    (solicitudesProvincia ?? 0) +
    (solicitudesPremium ?? 0);

  const { count: valoresPropuestos } = await supabase
    .from("ventajas")
    .select("id", { count: "exact", head: true })
    .eq("estado", "propuesta");

  const { count: leadsNuevos } = await supabase
    .from("leads_clinica")
    .select("id", { count: "exact", head: true })
    .eq("estado", "enviado");

  const contraido = (await cookies()).get("admin_menu")?.value === "contraido";

  return (
    <div data-clarity-mask="true" className="min-h-screen bg-paper-dim md:flex">
      <MenuLateral
        contraidoInicial={contraido}
        avisos={{
          cuentas: pendientes ?? 0,
          visibilidad: totalSolicitudes,
          leads: leadsNuevos ?? 0,
          valores: valoresPropuestos ?? 0,
        }}
      />
      <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 md:py-10">
        <div className="mx-auto max-w-[1600px]">{children}</div>
      </main>
    </div>
  );
}
