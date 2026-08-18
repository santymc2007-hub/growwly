import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { MobileMenu } from "./mobile-menu";
import { MenuTratamientos } from "./menu-tratamientos";
import { cerrarSesionClinica } from "@/app/clinica/actions";

export async function SiteHeader() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let esClinicaLogueada = false;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    esClinicaLogueada = profile?.role === "clinic";
  }

  const { data: tratamientos } = await supabase
    .from("tratamientos")
    .select("slug, nombre, categoria")
    .eq("publicado", true)
    .order("nombre", { ascending: true });

  return (
    <header className="relative z-20">
      <div className="mx-auto flex max-w-[1600px] items-center justify-between px-6 py-3">
        <Link href="/" className="flex items-center">
          <Image
            src="/brand/logo-home.png"
            alt="Growwly — Hair we go!"
            width={413}
            height={76}
            className="h-8 w-auto sm:h-9"
            priority
          />
        </Link>
        <nav className="hidden items-center gap-7 text-sm font-medium text-ink md:flex">
          <Link href="/" className="hover:text-teal">
            Inicio
          </Link>
          <Link href="/#como-funciona" className="hover:text-teal">
            Como Funciona
          </Link>
          <Link href="/clinicas" className="hover:text-teal">
            Clínicas
          </Link>
          <MenuTratamientos tratamientos={tratamientos ?? []} />
          <Link href="/blog" className="hover:text-teal">
            Blog
          </Link>
          <Link
            href="/cuenta"
            style={{
              background:
                "linear-gradient(white, white) padding-box, linear-gradient(90deg, var(--color-brand-green), var(--color-brand-blue)) border-box",
              border: "2px solid transparent",
            }}
            className="press rounded-full px-4 py-2 text-ink transition hover:opacity-80"
          >
            Mi cuenta
          </Link>
          {esClinicaLogueada ? (
            <form action={cerrarSesionClinica}>
              <button
                type="submit"
                className="press rounded-full bg-gradient-to-r from-brand-green to-brand-blue px-4 py-2 font-semibold text-teal-dark transition hover:opacity-90"
              >
                Cerrar sesión
              </button>
            </form>
          ) : (
            <Link
              href="/clinica/login"
              className="press rounded-full bg-gradient-to-r from-brand-green to-brand-blue px-4 py-2 font-semibold text-teal-dark transition hover:opacity-90"
            >
              Acceso Clínicas
            </Link>
          )}
        </nav>
        <MobileMenu esClinicaLogueada={esClinicaLogueada} tratamientos={tratamientos ?? []} />
      </div>
    </header>
  );
}
