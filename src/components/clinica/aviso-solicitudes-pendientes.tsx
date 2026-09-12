"use client";

import Link from "next/link";
import { useState } from "react";

export function AvisoSolicitudesPendientes({ cantidad }: { cantidad: number }) {
  const [abierto, setAbierto] = useState(cantidad > 0);

  if (!abierto) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6"
      onClick={() => setAbierto(false)}
    >
      <div
        className="modal-anim max-w-sm rounded-2xl bg-white p-6 text-center shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="font-display text-lg font-extrabold uppercase text-teal-dark">
          Tienes presupuestos pendientes
        </p>
        <p className="mt-3 text-sm text-ink-soft">
          No te demores en desbloquear — recuerda que ser el primero mejora
          sensiblemente las posibilidades de cerrar una consulta.
        </p>
        <div className="mt-6 flex flex-col gap-2">
          <Link
            href="/clinica/solicitudes"
            onClick={() => setAbierto(false)}
            className="press rounded-full bg-gradient-to-r from-yellow to-orange px-6 py-3 text-sm font-bold text-teal-dark transition hover:opacity-90"
          >
            Ver solicitudes ({cantidad})
          </Link>
          <button
            type="button"
            onClick={() => setAbierto(false)}
            className="press text-sm font-medium text-ink-soft hover:text-ink"
          >
            Ahora no
          </button>
        </div>
      </div>
    </div>
  );
}
