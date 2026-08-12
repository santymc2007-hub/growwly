"use client";

import { ConfirmButton } from "@/components/confirm-button";
import { borrarEstudio } from "../actions";

export function BorrarEstudioButton({ id }: { id: string }) {
  const borrarEsteEstudio = borrarEstudio.bind(null, id);

  return (
    <ConfirmButton
      action={borrarEsteEstudio}
      triggerLabel="Eliminar análisis"
      title="¿Seguro que quieres eliminar tu análisis?"
      message="Si lo borras, no podrás pedir presupuesto con este análisis — tendrías que subir fotos otra vez."
    />
  );
}
