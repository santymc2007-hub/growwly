"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";

/**
 * Tarjeta blanca contraíble para cada bloque del formulario de ficha
 * — mismo estilo en todos los módulos, para que se note dónde
 * empieza cada uno y se pueda plegar lo que no se está editando.
 *
 * Importante: el contenido se oculta con `hidden` (CSS), nunca
 * desmontándolo — si no, al plegar una sección se perderían sus
 * valores del FormData al guardar.
 */
export function SeccionFicha({
  titulo,
  defaultAbierta = true,
  children,
}: {
  titulo: string;
  defaultAbierta?: boolean;
  children: ReactNode;
}) {
  const [abierta, setAbierta] = useState(defaultAbierta);

  return (
    <section className="rounded-2xl border border-line bg-white p-5">
      <button
        type="button"
        onClick={() => setAbierta((a) => !a)}
        aria-expanded={abierta}
        className="flex w-full items-center justify-between gap-2 border-b border-line pb-2 text-left"
      >
        <h2 className="font-display text-lg text-teal-dark">{titulo}</h2>
        <ChevronDown
          className={`h-5 w-5 shrink-0 text-ink-soft transition-transform ${
            abierta ? "" : "-rotate-90"
          }`}
          aria-hidden
        />
      </button>
      <div className={abierta ? "mt-4" : "mt-4 hidden"}>{children}</div>
    </section>
  );
}
