import Image from "next/image";
import Link from "next/link";
import { Search } from "lucide-react";
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
      <div className="mx-auto flex max-w-[1400px] items-center justify-between px-6 py-3">
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/brand/growwly-logo-verde.png"
            alt="Growwly"
            width={365}
            height={130}
            className="h-12 w-auto sm:h-[54px]"
            priority
          />
          <span className="h-7 w-px bg-line sm:h-9" aria-hidden />
          <span className="font-display text-sm font-semibold text-teal-dark sm:text-[21px]">
            Hair we go!
          </span>
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
            href="/clinicas"
            aria-label="Buscar clínicas"
            className="press text-ink-soft hover:text-teal"
          >
            <Search size={18} aria-hidden />
          </Link>
          <Link
            href="/clinica/login"
            className="press rounded-full border-2 border-yellow px-4 py-2 font-semibold text-teal-dark transition hover:bg-yellow/10"
          >
            Acceso Clínicas
          </Link>
          {esClinicaLogueada ? (
            <form action={cerrarSesionClinica}>
              <button
                type="submit"
                className="press rounded-full bg-yellow px-4 py-2 font-semibold text-teal-dark transition hover:opacity-90"
              >
                Cerrar sesión
              </button>
            </form>
          ) : (
            <Link
              href="/cuenta"
              className="press rounded-full bg-yellow px-4 py-2 font-semibold text-teal-dark transition hover:opacity-90"
            >
              Mi cuenta
            </Link>
          )}
        </nav>
        <MobileMenu esClinicaLogueada={esClinicaLogueada} tratamientos={tratamientos ?? []} />
      </div>
    </header>
  );
}
