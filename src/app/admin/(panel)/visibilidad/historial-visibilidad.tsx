"use client";

import { useState } from "react";
export type EntradaLogVisibilidad = {
  /** Incluye tipos antiguos (destacado_home, destacado_ciudad) del historial. */
  tipo: string;
  accion: "alta" | "baja";
  motivo: string;
  meses_duracion: number | null;
  expira_en: string | null;
  creado_en: string;
};

const MOTIVO_LABEL: Record<string, string> = {
  aprobado_admin: "aprobado por admin",
  desactivado_admin: "desactivado por admin",
  expirado: "caducó solo",
};

function formatearFecha(iso: string): string {
  return new Date(iso).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatearFechaHora(iso: string): string {
  return new Date(iso).toLocaleString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Cronograma de altas/bajas de visibilidad de una clínica — lee
 * clinic_visibilidad_log, que ya registran activarVisibilidad y
 * desactivarVisibilidad (y el cron de expiración) cada vez que cambia
 * algo, así que esto es solo la vista de ese histórico.
 */
export function HistorialVisibilidad({
  nombreClinica,
  entradas,
  tipoLabel,
}: {
  nombreClinica: string;
  entradas: EntradaLogVisibilidad[];
  tipoLabel: Record<string, string>;
}) {
  const [abierto, setAbierto] = useState(false);

  if (entradas.length === 0) {
    return <span className="text-xs text-ink-soft">Sin historial</span>;
  }

  // Ya llegan ordenadas por creado_en desde la consulta, pero se
  // reordenan aquí también por si el componente se reutiliza en algún
  // sitio que no garantice ese orden — lo más reciente siempre arriba.
  const entradasOrdenadas = [...entradas].sort(
    (a, b) => new Date(b.creado_en).getTime() - new Date(a.creado_en).getTime(),
  );

  // Se agrupa por tipo (mismo orden de columnas que la tabla, ya que
  // tipoLabel se construye desde TIPO_LABEL) para que el historial de
  // una clínica con varios destacados activados no mezcle las altas y
  // bajas de todos en una única lista — cada tipo con su propio bloque.
  const tiposOrdenados = Object.keys(tipoLabel);
  const gruposPorTipo = tiposOrdenados
    .map((tipo) => ({
      tipo,
      entradas: entradasOrdenadas.filter((e) => e.tipo === tipo),
    }))
    .filter((grupo) => grupo.entradas.length > 0);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        className="text-xs font-medium text-cyan hover:text-cyan-dark"
      >
        {abierto ? "Ocultar" : `Ver (${entradas.length})`}
      </button>
      {abierto && (
        <div className="popover-anim absolute right-0 top-full z-20 mt-1 max-h-80 w-72 overflow-y-auto rounded-xl border border-line bg-white p-3 shadow-lg">
          <p className="mb-2 text-xs font-semibold text-ink">{nombreClinica}</p>
          <div className="flex flex-col gap-3">
            {gruposPorTipo.map(({ tipo, entradas: entradasTipo }) => (
              <div key={tipo} className="border-t border-line pt-2 first:border-0 first:pt-0">
                <p className="mb-1.5 text-[11px] font-semibold text-ink">
                  {tipoLabel[tipo] ?? tipo}
                </p>
                <ul className="flex flex-col gap-2">
                  {entradasTipo.map((e, i) => (
                    <li key={i} className="text-xs text-ink-soft">
                      <span
                        className={
                          e.accion === "alta"
                            ? "font-medium text-teal-dark"
                            : "font-medium text-error-dark"
                        }
                      >
                        {e.accion === "alta" ? "↑ Alta" : "↓ Baja"}
                      </span>{" "}
                      — {formatearFechaHora(e.creado_en)}
                      <br />
                      {MOTIVO_LABEL[e.motivo] ?? e.motivo}
                      {e.accion === "alta" && (
                        <>
                          {" "}
                          ·{" "}
                          {e.meses_duracion
                            ? `${e.meses_duracion} ${e.meses_duracion === 1 ? "mes" : "meses"}`
                            : "indefinido"}
                          {e.expira_en ? ` (hasta ${formatearFecha(e.expira_en)})` : ""}
                        </>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
