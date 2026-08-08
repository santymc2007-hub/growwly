"use client";

import { aprobarCuentaClinica, rechazarCuentaClinica } from "./actions";

export function AprobarRechazarButtons({ profileId }: { profileId: string }) {
  const aprobar = aprobarCuentaClinica.bind(null, profileId);
  const rechazar = rechazarCuentaClinica.bind(null, profileId);

  return (
    <div className="flex gap-2">
      <form action={aprobar}>
        <button
          type="submit"
          className="rounded-lg bg-teal px-3 py-1.5 text-xs font-medium text-paper hover:bg-teal-dark"
        >
          Aprobar
        </button>
      </form>
      <form
        action={rechazar}
        onSubmit={(e) => {
          if (!confirm("¿Rechazar esta solicitud de cuenta de clínica?")) {
            e.preventDefault();
          }
        }}
      >
        <button
          type="submit"
          className="rounded-lg border border-line px-3 py-1.5 text-xs font-medium text-ink-soft hover:border-error hover:text-error"
        >
          Rechazar
        </button>
      </form>
    </div>
  );
}
