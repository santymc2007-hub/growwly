import { INFO_NIVEL, leerFuentes, nivelValido } from "@/lib/tratamientos/evidencia";
import type { Tratamiento } from "@/lib/supabase/database.types";

/**
 * «¿Qué dice la ciencia?» en la ficha de un tratamiento. Solo se pinta
 * si está revisado, tiene nivel y al menos una fuente.
 */
export function EvidenciaTratamiento({
  tratamiento,
}: {
  tratamiento: Pick<
    Tratamiento,
    "evidencia" | "evidencia_texto" | "evidencia_fuentes" | "evidencia_revisada" | "evidencia_actualizada"
  >;
}) {
  const nivel = nivelValido(tratamiento.evidencia);
  const fuentes = leerFuentes(tratamiento.evidencia_fuentes);
  if (!tratamiento.evidencia_revisada || !nivel || fuentes.length === 0) return null;
  const info = INFO_NIVEL[nivel];
  const fecha = tratamiento.evidencia_actualizada
    ? new Date(tratamiento.evidencia_actualizada).toLocaleDateString("es-ES", {
        month: "long",
        year: "numeric",
        timeZone: "Europe/Madrid",
      })
    : null;

  return (
    <section
      aria-labelledby="evidencia-titulo"
      className="mt-6 rounded-2xl border border-line bg-white p-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="evidencia-titulo" className="font-display text-lg text-teal-dark">
          ¿Qué dice la ciencia?
        </h2>
        <span
          className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-semibold ${info.clase}`}
        >
          <span className="flex items-end gap-0.5" aria-hidden>
            {[1, 2, 3, 4].map((b) => (
              <span
                key={b}
                className={`w-1 rounded-sm bg-current ${b <= info.barras ? "opacity-100" : "opacity-25"}`}
                style={{ height: 4 + b * 3 }}
              />
            ))}
          </span>
          {info.etiqueta}
        </span>
      </div>
      {tratamiento.evidencia_texto && (
        <p className="mt-3 text-sm leading-relaxed text-ink">{tratamiento.evidencia_texto}</p>
      )}
      <p className="mt-2 text-xs text-ink-soft">{info.descripcion}</p>
      <details className="mt-3 text-sm">
        <summary className="cursor-pointer font-medium text-teal-dark">
          Fuentes ({fuentes.length})
        </summary>
        <ul className="mt-2 flex flex-col gap-1.5 pl-1">
          {fuentes.map((f) => (
            <li key={f.url}>
              <a
                href={f.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-teal underline-offset-2 hover:underline"
              >
                {f.titulo} ↗
              </a>
            </li>
          ))}
        </ul>
      </details>
      <p className="mt-3 text-xs text-ink-soft">
        Resumen informativo de la literatura científica{fecha ? `, revisado en ${fecha}` : ""}. No
        valora a ninguna clínica ni sustituye una consulta médica.
      </p>
    </section>
  );
}
