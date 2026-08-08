"use client";

import { desbloquearLead } from "./actions";

export function DesbloquearButton({ token }: { token: string }) {
  const desbloquearEsteLead = desbloquearLead.bind(null, token);

  return (
    <form
      action={desbloquearEsteLead}
      onSubmit={(e) => {
        if (
          !confirm(
            "¿Confirmas que quieres desbloquear el perfil completo de este paciente? Growwly te facturará este lead.",
          )
        ) {
          e.preventDefault();
        }
      }}
    >
      <button
        type="submit"
        className="mt-3 rounded-lg bg-teal px-5 py-2.5 text-sm font-medium text-paper transition hover:bg-teal-dark"
      >
        Desbloquear perfil completo
      </button>
    </form>
  );
}
