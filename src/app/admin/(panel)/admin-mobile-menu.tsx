"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { logout } from "./actions";

export function AdminMobileMenu({
  pendientes,
  totalSolicitudes,
  leadsNuevos,
}: {
  pendientes: number;
  totalSolicitudes: number;
  leadsNuevos: number;
}) {
  const [abierto, setAbierto] = useState(false);

  const enlace = (href: string, label: string, badge?: number) => (
    <Link
      href={href}
      className="flex items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-paper/90 hover:bg-white/10"
      onClick={() => setAbierto(false)}
    >
      {label}
      {Boolean(badge) && (
        <span className="rounded-full bg-cyan px-1.5 py-0.5 text-xs font-bold text-white">
          {badge}
        </span>
      )}
    </Link>
  );

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        aria-label={abierto ? "Cerrar menú" : "Abrir menú"}
        aria-expanded={abierto}
        className="press flex h-9 w-9 items-center justify-center rounded-lg text-paper hover:bg-white/10"
      >
        {abierto ? <X size={22} /> : <Menu size={22} />}
      </button>

      {abierto && (
        <div
          className="popover-anim absolute inset-x-0 top-full z-40 border-b border-line bg-teal px-6 py-4 shadow-lg"
          style={{ transformOrigin: "top" }}
        >
          <nav className="flex flex-col gap-1">
            {enlace("/admin/clinicas", "Clínicas")}
            {enlace("/admin/visibilidad", "Visibilidad", totalSolicitudes)}
            {enlace("/admin/leads", "Leads", leadsNuevos)}
            {enlace("/admin/hero-slides", "Hero")}
            {enlace("/admin/blog", "Blog")}
            {enlace("/admin/tratamientos", "Tratamientos")}
            {enlace("/admin/geografia", "Geografía")}
            {enlace("/admin/clinicas-cuentas", "Cuentas de clínica", pendientes)}
          </nav>
          <form action={logout} className="mt-2 border-t border-white/15 pt-2">
            <button
              type="submit"
              className="w-full rounded-lg px-3 py-2.5 text-left text-sm text-paper/80 hover:bg-white/10"
            >
              Cerrar sesión
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
