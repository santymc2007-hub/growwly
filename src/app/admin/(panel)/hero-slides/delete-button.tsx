"use client";

import { deleteSlide } from "./actions";

export function DeleteSlideButton({
  id,
  titulo,
}: {
  id: string;
  titulo: string;
}) {
  const borrarEstaSlide = deleteSlide.bind(null, id);

  return (
    <form
      action={borrarEstaSlide}
      onSubmit={(e) => {
        if (!confirm(`¿Borrar la slide "${titulo}"? No se puede deshacer.`)) {
          e.preventDefault();
        }
      }}
    >
      <button type="submit" className="font-medium text-ink-soft hover:text-error">
        Eliminar
      </button>
    </form>
  );
}
