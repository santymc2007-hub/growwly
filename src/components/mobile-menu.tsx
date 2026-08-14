"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X, User, Store, LogOut } from "lucide-react";
import { cerrarSesionClinica } from "@/app/clinica/actions";

export function MobileMenu({
  esClinicaLogueada = false,
}: {
  esClinicaLogueada?: boolean;
}) {
  const [abierto, setAbierto] = useState(false);

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        aria-label={abierto ? "Cerrar menú" : "Abrir menú"}
        aria-expanded={abierto}
        className="press flex h-9 w-9 items-center justify-center rounded-lg text-ink hover:bg-paper-dim"
      >
        {abierto ? <X size={22} /> : <Menu size={22} />}
      </button>

      {abierto && (
        <div
          className="popover-anim absolute inset-x-0 top-full z-40 border-b border-line bg-white px-6 py-4 shadow-lg"
          style={{ transformOrigin: "top" }}
        >
          <nav className="flex flex-col gap-1 text-sm font-medium text-ink-soft">
            <Link
              href="/"
              className="rounded-lg px-3 py-2.5 hover:bg-paper-dim hover:text-teal"
              onClick={() => setAbierto(false)}
            >
              Inicio
            </Link>
            <Link
              href="/#como-funciona"
              className="rounded-lg px-3 py-2.5 hover:bg-paper-dim hover:text-teal"
              onClick={() => setAbierto(false)}
            >
              Como Funciona
            </Link>
            <Link
              href="/clinicas"
              className="rounded-lg px-3 py-2.5 hover:bg-paper-dim hover:text-teal"
              onClick={() => setAbierto(false)}
            >
              Clínicas
            </Link>
            <Link
              href="/blog"
              className="rounded-lg px-3 py-2.5 hover:bg-paper-dim hover:text-teal"
              onClick={() => setAbierto(false)}
            >
              Blog
            </Link>
            <Link
              href="/tratamientos"
              className="rounded-lg px-3 py-2.5 hover:bg-paper-dim hover:text-teal"
              onClick={() => setAbierto(false)}
            >
              Tratamientos
            </Link>
            <Link
              href="/cuenta"
              className="flex items-center gap-2 rounded-lg px-3 py-2.5 hover:bg-paper-dim hover:text-teal"
              onClick={() => setAbierto(false)}
            >
              <User size={16} aria-hidden />
              Mi cuenta
            </Link>
            <div className="my-1 border-t border-line" aria-hidden />
            {esClinicaLogueada ? (
              <form action={cerrarSesionClinica}>
                <button
                  type="submit"
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-ink-soft/80 hover:bg-paper-dim hover:text-error"
                >
                  <LogOut size={15} aria-hidden />
                  Cerrar sesión (clínica)
                </button>
              </form>
            ) : (
              <Link
                href="/clinica/login"
                className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-ink-soft/80 hover:bg-paper-dim hover:text-cyan"
                onClick={() => setAbierto(false)}
              >
                <Store size={15} aria-hidden />
                Acceso clínicas
              </Link>
            )}
          </nav>
        </div>
      )}
    </div>
  );
}
