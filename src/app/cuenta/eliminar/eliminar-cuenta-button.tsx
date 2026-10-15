"use client";

import { ConfirmButton } from "@/components/confirm-button";
import { eliminarCuenta } from "../actions";

export function EliminarCuentaButton() {
  return (
    <ConfirmButton
      action={eliminarCuenta}
      triggerLabel="Eliminar mi cuenta"
      title="¿Seguro que quieres eliminar tu cuenta?"
      message="Borraremos tu perfil, tus valoraciones con sus fotos y tus solicitudes de presupuesto. No se puede deshacer. La clínica que ya elegiste conserva los datos que le compartiste."
      confirmLabel="Sí, eliminar mi cuenta"
      triggerClassName="text-sm font-medium text-ink-soft underline hover:text-error"
    />
  );
}
