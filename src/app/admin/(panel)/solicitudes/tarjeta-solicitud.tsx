"use client";

import { aprobarSolicitud, rechazarSolicitud } from "./actions";

type Tipo = "destacado" | "destacado_home" | "destacado_ciudad" | "premium";

const ETIQUETA: Record<Tipo, string> = {
  destacado: "★ Destacado en el listado",
  destacado_home: "🏠 Destacado en la Home",
  destacado_ciudad: "📍 Destacado en su ciudad",
  premium: "✦ Plan Premium",
};

export function TarjetaSolicitud({
  clinicId,
  clinicNombre,
  tipo,
}: {
  clinicId: string;
  clinicNombre: string;
  tipo: Tipo;
}) {
  const aprobar = aprobarSolicitud.bind(null, clinicId, tipo);
  const rechazar = rechazarSolicitud.bind(null, clinicId, tipo);

  return (
    <div className="flex items-center justify-between rounded-2xl border border-line bg-white px-5 py-4">
      <div>
        <p className="font-medium text-ink">{clinicNombre}</p>
        <p className="text-sm text-ink-soft">{ETIQUETA[tipo]}</p>
      </div>
      <div className="flex gap-2">
        <form action={rechazar}>
          <button
            type="submit"
            className="rounded-full border border-line px-4 py-2 text-sm font-medium text-ink-soft transition hover:bg-paper-dim"
          >
            Rechazar
          </button>
        </form>
        <form action={aprobar}>
          <button
            type="submit"
            className="rounded-full bg-teal px-4 py-2 text-sm font-medium text-paper transition hover:bg-teal-dark"
          >
            Aprobar
          </button>
        </form>
      </div>
    </div>
  );
}
