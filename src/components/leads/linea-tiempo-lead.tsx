import type { PasoTimeline } from "@/lib/leads/linea-tiempo";

/**
 * Línea de tiempo visual de un lead — el "camino feliz" del pipeline
 * paso a paso, con la fecha de cada hito cuando ya se conoce. El
 * aviso de estado negativo (si lo hay) se muestra aparte, al final.
 */
export function LineaTiempoLead({
  pasos,
  avisoNegativo,
}: {
  pasos: PasoTimeline[];
  avisoNegativo: string | null;
}) {
  return (
    <div className="rounded-xl border border-line bg-white p-4">
      <ol className="flex flex-col">
        {pasos.map((paso, idx) => (
          <li key={paso.estado} className="relative flex gap-3 pb-4 last:pb-0">
            {idx < pasos.length - 1 && (
              <span
                className={`absolute left-[7px] top-4 h-full w-0.5 ${
                  paso.status === "completado" ? "bg-teal" : "bg-line"
                }`}
                aria-hidden
              />
            )}
            <span
              className={`relative z-10 mt-0.5 h-4 w-4 shrink-0 rounded-full border-2 ${
                paso.status === "completado"
                  ? "border-teal bg-teal"
                  : paso.status === "actual"
                    ? "border-teal bg-white"
                    : "border-line bg-white"
              }`}
              aria-hidden
            />
            <div className="min-w-0 flex-1">
              <p
                className={`text-sm ${
                  paso.status === "pendiente" ? "text-ink-soft" : "font-medium text-ink"
                }`}
              >
                {paso.label}
              </p>
              {paso.fecha && (
                <p className="text-xs text-ink-soft">
                  {new Date(paso.fecha).toLocaleDateString("es-ES", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              )}
            </div>
          </li>
        ))}
      </ol>

      {avisoNegativo && (
        <p className="mt-2 rounded-lg bg-error/10 px-3 py-2 text-xs font-medium text-error-dark">
          {avisoNegativo}
        </p>
      )}
    </div>
  );
}
