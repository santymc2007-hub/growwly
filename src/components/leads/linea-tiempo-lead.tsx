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
  const ultimoHecho = pasos.reduce((acc, p, i) => (p.status !== "pendiente" ? i : acc), -1);
  const n = pasos.length;

  return (
    <div className="rounded-xl border border-line bg-white p-4 sm:p-5">
      <div className="overflow-x-auto">
        <ol
          className="relative grid min-w-[640px]"
          style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}
        >
          <span
            aria-hidden
            className="absolute top-[7px] h-0.5 bg-line"
            style={{ left: `${50 / n}%`, right: `${50 / n}%` }}
          />
          {ultimoHecho > 0 && (
            <span
              aria-hidden
              className="absolute top-[7px] h-0.5 bg-teal"
              style={{ left: `${50 / n}%`, width: `${(ultimoHecho * 100) / n}%` }}
            />
          )}
          {pasos.map((paso) => (
            <li key={paso.estado} className="relative flex flex-col items-center gap-1.5 px-1 text-center">
              <span
                className={`relative z-10 h-4 w-4 shrink-0 rounded-full border-2 ${
                  paso.status === "completado"
                    ? "border-teal bg-teal"
                    : paso.status === "actual"
                      ? "border-teal bg-white"
                      : "border-line bg-white"
                }`}
                aria-hidden
              />
              <p
                className={`text-[13px] leading-snug ${
                  paso.status === "pendiente" ? "text-ink-soft" : "font-medium text-ink"
                }`}
              >
                {paso.label}
              </p>
              {paso.fecha && paso.status !== "pendiente" && (
                <p className="text-xs text-ink-soft">
                  {new Date(paso.fecha)
                    .toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })
                    .replace(".", "")}
                </p>
              )}
            </li>
          ))}
        </ol>
      </div>

      {avisoNegativo && (
        <p className="mt-3 rounded-lg bg-error/10 px-3 py-2 text-xs font-medium text-error-dark">
          {avisoNegativo}
        </p>
      )}
    </div>
  );
}
