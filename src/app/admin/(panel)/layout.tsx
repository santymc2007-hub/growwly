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
              <Link href="/admin/leads" className="hover:text-cyan">
                Leads
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
