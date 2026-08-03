"use client";

import { deleteClinic } from "./actions";

export function DeleteClinicButton({
  id,
  nombre,
}: {
  id: string;
  nombre: string;
}) {
  const deleteThisClinic = deleteClinic.bind(null, id);

  return (
    <form
      action={deleteThisClinic}
      onSubmit={(e) => {
        if (
          !confirm(`¿Eliminar "${nombre}"? Esta acción no se puede deshacer.`)
        ) {
          e.preventDefault();
        }
      }}
      className="inline"
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
