import { SelloScore } from "@/components/ui/sello-score";

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
    <div className="mt-3 flex items-center gap-4 rounded-lg bg-white/60 p-3">
      <SelloScore tipo="match" valor={matchScore} size={88} />
      <p className="text-sm text-sage-ink">
        <span className="font-semibold">Tu Match Score es del {matchScore}%.</span> Hemos
        encontrado {numeroClinicas} {numeroClinicas === 1 ? "clínica" : "clínicas"} que se
        ajustan a tu petición.
      </p>
    </div>
  );
}
