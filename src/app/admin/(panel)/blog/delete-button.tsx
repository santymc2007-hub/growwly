"use client";

import { deletePost } from "./actions";

export function DeletePostButton({ id, titulo }: { id: string; titulo: string }) {
  const borrarEstaEntrada = deletePost.bind(null, id);

  return (
    <form
      action={borrarEstaEntrada}
      onSubmit={(e) => {
        if (!confirm(`¿Borrar la entrada "${titulo}"? No se puede deshacer.`)) {
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
