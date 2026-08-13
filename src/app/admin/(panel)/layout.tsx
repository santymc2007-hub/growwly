import Image from "next/image";
import Link from "next/link";
import { logout } from "./actions";
import { createAdminClient } from "@/lib/supabase/admin";

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
  const { count: solicitudesHome } = await supabase
    .from("clinics")
    .select("id", { count: "exact", head: true })
    .eq("destacado_home_solicitado", true);
  const { count: solicitudesCiudad } = await supabase
    .from("clinics")
    .select("id", { count: "exact", head: true })
    .eq("destacado_ciudad_solicitado", true);
  const { count: solicitudesPremium } = await supabase
    .from("clinics")
    .select("id", { count: "exact", head: true })
    .not("plan_solicitado", "is", null);
  const totalSolicitudes =
    (solicitudesDestacado ?? 0) +
    (solicitudesHome ?? 0) +
    (solicitudesCiudad ?? 0) +
    (solicitudesPremium ?? 0);

  const { count: leadsNuevos } = await supabase
    .from("leads_clinica")
    .select("id", { count: "exact", head: true })
    .eq("estado", "enviado");

  return (
    <div className="min-h-screen bg-paper-dim">
      <header className="border-b border-line bg-teal text-paper">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between px-6 py-4">
          <div className="flex items-center gap-5">
            <Image
              src="/brand/growwly-logo-white.png"
              alt="Growwly"
              width={97}
              height={33}
              className="h-7 w-auto"
              priority
            />
            <span className="rounded-full bg-white/15 px-2 py-0.5 text-xs font-medium tracking-wide text-paper/80">
              PANEL
            </span>
            <nav className="flex gap-4 text-sm">
              <Link href="/admin/clinicas" className="hover:text-cyan">
                Clínicas
              </Link>
              <Link
                href="/admin/solicitudes"
                className="flex items-center gap-1.5 hover:text-cyan"
              >
                Solicitudes
                {totalSolicitudes > 0 && (
                  <span className="rounded-full bg-cyan px-1.5 py-0.5 text-xs font-bold text-white">
                    {totalSolicitudes}
                  </span>
                )}
              </Link>
              <Link
                href="/admin/leads"
                className="flex items-center gap-1.5 hover:text-cyan"
              >
                Leads
                {Boolean(leadsNuevos) && (
                  <span className="rounded-full bg-cyan px-1.5 py-0.5 text-xs font-bold text-white">
                    {leadsNuevos}
                  </span>
                )}
              </Link>
              <Link href="/admin/blog" className="hover:text-cyan">
                Blog
              </Link>
              <Link href="/admin/tratamientos" className="hover:text-cyan">
                Tratamientos
              </Link>
              <Link
                href="/admin/clinicas-cuentas"
                className="flex items-center gap-1.5 hover:text-cyan"
              >
                Cuentas de clínica
                {Boolean(pendientes) && (
                  <span className="rounded-full bg-cyan px-1.5 py-0.5 text-xs font-bold text-white">
                    {pendientes}
                  </span>
                )}
              </Link>
            </nav>
          </div>
          <form action={logout}>
            <button
              type="submit"
              className="text-sm text-paper/80 hover:text-paper"
            >
              Cerrar sesión
            </button>
          </form>
        </div>
      </header>

      <main className="mx-auto max-w-[1600px] px-6 py-10">{children}</main>
    </div>
  );
}
