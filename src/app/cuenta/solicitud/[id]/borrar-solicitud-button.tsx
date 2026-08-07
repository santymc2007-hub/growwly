"use client";

import { borrarSolicitud } from "../actions";

export function BorrarSolicitudButton({ id }: { id: string }) {
  const borrarEstaSolicitud = borrarSolicitud.bind(null, id);

  return (
    <form
      action={borrarEstaSolicitud}
      onSubmit={(e) => {
        if (
          !confirm(
            "¿Retirar esta solicitud de presupuesto? Esta acción no se puede deshacer.",
          )
        ) {
          e.preventDefault();
        }
      }}
    >
      <button
        type="submit"
        className="text-sm font-medium text-ink-soft hover:text-error"
      >
        Retirar solicitud
      </button>
    </form>
  );
}
