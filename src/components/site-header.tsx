import Image from "next/image";
import Link from "next/link";
import { Search } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { MobileMenu } from "./mobile-menu";
import { MenuTratamientos } from "./menu-tratamientos";
import { cerrarSesionClinica } from "@/app/clinica/actions";
import { cerrarSesionPaciente } from "@/app/cuenta/actions";
import { tratamientosMenu } from "@/lib/nav-publica-cache";

export async function SiteHeader() {
  const supabase = await createClient();
  // getSession() lee el token de la cookie sin llamar a Supabase Auth
  // por red — aquí solo decide qué botón pintar (Mi cuenta / Acceso
  // Clínicas / Cerrar sesión), no protege nada: eso ya lo hace el
  // middleware (con getUser(), que sí verifica contra el servidor) en
  // /admin, y cada Server Action de datos sensibles por su cuenta.
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user ?? null;

  let esClinicaLogueada = false;
  let esPacienteLogueado = false;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    esClinicaLogueada = profile?.role === "clinic";
    esPacienteLogueado = profile?.role === "patient";
  }

  const tratamientos = await tratamientosMenu();

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
          <MenuTratamientos tratamientos={tratamientos} />
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
          {esPacienteLogueado ? (
            // Un paciente con sesión no necesita "Acceso Clínicas": ese
            // hueco pasa a ser su acceso a "Mi cuenta".
            <Link
              href="/cuenta"
              className="press rounded-full border-2 border-yellow px-4 py-2 font-semibold text-teal-dark transition hover:bg-yellow/10"
            >
              Mi cuenta
            </Link>
          ) : (
            <Link
              href="/clinica/login"
              className="press rounded-full border-2 border-yellow px-4 py-2 font-semibold text-teal-dark transition hover:bg-yellow/10"
            >
              Acceso Clínicas
            </Link>
          )}
          {esClinicaLogueada || esPacienteLogueado ? (
            <form action={esClinicaLogueada ? cerrarSesionClinica : cerrarSesionPaciente}>
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
        <MobileMenu esClinicaLogueada={esClinicaLogueada} esPacienteLogueado={esPacienteLogueado} tratamientos={tratamientos} />
      </div>
    </header>
  );
}
