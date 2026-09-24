/**
 * Sello gráfico del Match Score de cara al paciente — cuánto encajan
 * las clínicas encontradas con su petición concreta. Distinto del
 * Growwly Score (que mide a la clínica en general, no en relación a
 * un paciente): aquí se muestra el mejor de los matches encontrados.
 */
export function SelloMatchScore({
  matchScore,
  numeroClinicas,
}: {
  matchScore: number;
  numeroClinicas: number;
}) {
  return (
    <div className="mt-3 flex items-center gap-3 rounded-lg bg-white/60 p-3">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white shadow-sm">
        <span className="font-display text-sm font-extrabold text-teal-dark">
          {matchScore}%
        </span>
      </div>
      <p className="text-sm text-sage-ink">
        <span className="font-semibold">Tu Match Score es del {matchScore}%.</span> Hemos
        encontrado {numeroClinicas} {numeroClinicas === 1 ? "clínica" : "clínicas"} que se
        ajustan a tu petición.
      </p>
    </div>
  );
}
