"use client";

import { deleteTratamiento } from "./actions";

export function DeleteTratamientoButton({
  id,
  nombre,
}: {
  id: string;
  nombre: string;
}) {
  const borrarEsteTratamiento = deleteTratamiento.bind(null, id);

  return (
    <form
      action={borrarEsteTratamiento}
      onSubmit={(e) => {
        if (!confirm(`¿Borrar "${nombre}"? No se puede deshacer.`)) {
          e.preventDefault();
        }
      }}
    >
      <button
        type="submit"
        className="font-medium text-ink-soft hover:text-error"
      >
        Eliminar
      </button>
    </form>
  );
}
