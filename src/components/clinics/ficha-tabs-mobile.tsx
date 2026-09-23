"use client";

import { useState, type ReactNode } from "react";

/**
 * En móvil, "Información" y "Contacto" pasan de estar apiladas en
 * una sola columna larga a alternarse con dos pestañas discretas —
 * sin navegar a otra URL. En escritorio no cambia nada: ambas
 * columnas siguen visibles a la vez, como siempre (el interruptor
 * de pestañas ni se muestra ahí).
 */
export function FichaTabsMobile({
  informacion,
  contacto,
}: {
  informacion: ReactNode;
  contacto: ReactNode;
}) {
  const [tab, setTab] = useState<"informacion" | "contacto">("informacion");

  return (
    <div className="grid gap-10 px-6 py-8 sm:px-10 lg:grid-cols-[1fr_360px]">
      <div className="inline-flex w-fit rounded-full border border-line bg-white p-1 lg:hidden">
        <button
          type="button"
          onClick={() => setTab("informacion")}
          className={`press rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
            tab === "informacion"
              ? "bg-teal-dark text-white"
              : "text-ink-soft hover:text-teal-dark"
          }`}
        >
          Información
        </button>
        <button
          type="button"
          onClick={() => setTab("contacto")}
          className={`press rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
            tab === "contacto"
              ? "bg-teal-dark text-white"
              : "text-ink-soft hover:text-teal-dark"
          }`}
        >
          Contacto
        </button>
      </div>

      <div className={tab === "informacion" ? "block" : "hidden lg:block"}>
        {informacion}
      </div>
      <div className={tab === "contacto" ? "block" : "hidden lg:block"}>
        {contacto}
      </div>
    </div>
  );
}
