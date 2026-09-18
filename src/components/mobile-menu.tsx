"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X, User, Store, LogOut, ChevronDown } from "lucide-react";
import { cerrarSesionClinica } from "@/app/clinica/actions";
import { CATEGORIAS_TRATAMIENTO } from "@/lib/clinic-options";

type Tratamiento = { slug: string; nombre: string; categoria: string | null };

export function MobileMenu({
  esClinicaLogueada = false,
  tratamientos = [],
}: {
  esClinicaLogueada?: boolean;
  tratamientos?: Tratamiento[];
}) {
  const [abierto, setAbierto] = useState(false);
  const [tratamientosAbierto, setTratamientosAbierto] = useState(false);

  const porCategoria = CATEGORIAS_TRATAMIENTO.map((categoria) => ({
    categoria,
    items: tratamientos.filter((t) => t.categoria === categoria),
  })).filter((c) => c.items.length > 0);

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
            <div>
              <button
                type="button"
                onClick={() => setTratamientosAbierto((v) => !v)}
                aria-expanded={tratamientosAbierto}
                className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left hover:bg-paper-dim hover:text-teal"
              >
                Tratamientos
                <ChevronDown
                  size={16}
                  aria-hidden
                  className={`transition-transform duration-200 ease-out ${tratamientosAbierto ? "rotate-180" : ""}`}
                />
              </button>
              {tratamientosAbierto && (
                <div className="popover-anim ml-3 mt-1 flex flex-col gap-3 border-l border-line pl-3" style={{ transformOrigin: "top" }}>
                  {porCategoria.map(({ categoria, items }) => (
                    <div key={categoria}>
                      <p className="px-3 text-[11px] font-semibold uppercase tracking-wide text-ink-soft/70">
                        {categoria}
                      </p>
                      {items.map((t) => (
                        <Link
                          key={t.slug}
                          href={`/tratamientos/${t.slug}`}
                          className="block rounded-lg px-3 py-1.5 text-sm text-ink-soft hover:bg-paper-dim hover:text-teal"
                          onClick={() => setAbierto(false)}
                        >
                          {t.nombre}
                        </Link>
                      ))}
                    </div>
                  ))}
                  <Link
                    href="/tratamientos"
                    className="rounded-lg px-3 py-1.5 text-sm font-medium text-cyan hover:text-cyan-dark"
                    onClick={() => setAbierto(false)}
                  >
                    Ver todos →
                  </Link>
                </div>
              )}
            </div>
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
