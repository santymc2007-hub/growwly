"use client";

import Link from "next/link";
import { useState, useRef } from "react";
import { ChevronDown } from "lucide-react";
import { CATEGORIAS_TRATAMIENTO } from "@/lib/clinic-options";

type Tratamiento = { slug: string; nombre: string; categoria: string | null };

export function MenuTratamientos({ tratamientos }: { tratamientos: Tratamiento[] }) {
  const [abierto, setAbierto] = useState(false);
  const cerrarConRetraso = useRef<ReturnType<typeof setTimeout> | null>(null);

  function abrir() {
    if (cerrarConRetraso.current) clearTimeout(cerrarConRetraso.current);
    setAbierto(true);
  }
  function cerrar() {
    cerrarConRetraso.current = setTimeout(() => setAbierto(false), 150);
  }

  const porCategoria = CATEGORIAS_TRATAMIENTO.map((categoria) => ({
    categoria,
    items: tratamientos.filter((t) => t.categoria === categoria),
  })).filter((c) => c.items.length > 0);

  return (
    <div className="relative" onMouseEnter={abrir} onMouseLeave={cerrar}>
      <Link
        href="/tratamientos"
        className="flex items-center gap-1 hover:text-teal"
        aria-expanded={abierto}
      >
        Tratamientos
        <ChevronDown
          size={14}
          aria-hidden
          className={`transition-transform duration-200 ease-out ${abierto ? "rotate-180" : ""}`}
        />
      </Link>

      {abierto && porCategoria.length > 0 && (
        <div
          className="popover-anim absolute left-1/2 top-full z-30 mt-3 w-[640px] -translate-x-1/2 rounded-2xl border border-line bg-white p-6 shadow-xl"
          style={{ transformOrigin: "top center" }}
        >
          <div className="grid grid-cols-2 gap-x-8 gap-y-6">
            {porCategoria.map(({ categoria, items }) => (
              <div key={categoria}>
                <p className="text-xs font-semibold uppercase tracking-wide text-cyan-dark">
                  {categoria}
                </p>
                <ul className="mt-2 flex flex-col gap-1.5">
                  {items.map((t) => (
                    <li key={t.slug}>
                      <Link
                        href={`/tratamientos/${t.slug}`}
                        className="text-sm text-ink-soft hover:text-teal"
                      >
                        {t.nombre}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <Link
            href="/tratamientos"
            className="mt-5 inline-block text-sm font-medium text-cyan hover:text-cyan-dark"
          >
            Ver todos los tratamientos →
          </Link>
        </div>
      )}
    </div>
  );
}
