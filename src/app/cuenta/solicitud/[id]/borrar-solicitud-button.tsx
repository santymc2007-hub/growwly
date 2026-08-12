"use client";

import { ConfirmButton } from "@/components/confirm-button";
import { borrarSolicitud } from "../actions";

export function BorrarSolicitudButton({ id }: { id: string }) {
  const borrarEstaSolicitud = borrarSolicitud.bind(null, id);

  return (
    <ConfirmButton
      action={borrarEstaSolicitud}
      triggerLabel="Retirar solicitud"
      title="¿Retirar esta solicitud de presupuesto?"
      message="Las clínicas a las que ya se envió dejarán de poder contactarte por esta vía. Esta acción no se puede deshacer."
      confirmLabel="Sí, retirar"
    />
  );
}
