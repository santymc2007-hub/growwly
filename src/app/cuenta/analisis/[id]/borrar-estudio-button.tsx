"use client";

import { borrarEstudio } from "../actions";

export function BorrarEstudioButton({ id }: { id: string }) {
  const borrarEsteEstudio = borrarEstudio.bind(null, id);

  return (
    <form
      action={borrarEsteEstudio}
      onSubmit={(e) => {
        if (
          !confirm(
            "¿Eliminar este análisis y sus fotos? Esta acción no se puede deshacer.",
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
        Eliminar análisis
      </button>
    </form>
  );
}
