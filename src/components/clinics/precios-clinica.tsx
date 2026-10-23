import {
  TRAMOS_NORWOOD,
  etiquetaModalidad,
  textoRango,
  type FilaPrecio,
} from "@/lib/clinica/comparables";

/**
 * Precios orientativos de la ficha pública (solo filas con precio
 * visible y alguna cifra). Las de "según grado Norwood" se desglosan.
 */
export function PreciosClinica({ filas }: { filas: FilaPrecio[] }) {
  const conPrecio = filas.filter(
    (f) =>
      f.visible &&
      (f.desde !== null ||
        f.hasta !== null ||
        Object.values(f.norwood ?? {}).some((t) => t?.desde != null || t?.hasta != null)),
  );
  if (!conPrecio.length) return null;

  return (
    <ul className="mt-2 flex flex-col gap-3">
      {conPrecio.map((f, i) => (
        <li key={`${f.tratamiento}-${i}`} className="text-sm">
          <p className="font-medium text-ink">{f.tratamiento}</p>
          {f.modalidad === "norwood" ? (
            <ul className="mt-1 flex flex-col gap-0.5">
              {TRAMOS_NORWOOD.map((t) => {
                const tramo = f.norwood?.[t];
                const texto = tramo ? textoRango(tramo.desde, tramo.hasta) : null;
                return texto ? (
                  <li key={t} className="flex justify-between gap-3 text-ink-soft">
                    <span>Norwood {t.replace("-", "–")}</span>
                    <span className="text-ink">{texto}</span>
                  </li>
                ) : null;
              })}
            </ul>
          ) : (
            <p className="text-ink-soft">
              <span className="text-ink">{textoRango(f.desde, f.hasta)}</span>
              {f.modalidad !== "total" && ` · ${etiquetaModalidad(f.modalidad)?.toLowerCase()}`}
            </p>
          )}
          {f.nota && <p className="mt-0.5 break-words text-xs text-ink-soft">{f.nota}</p>}
        </li>
      ))}
    </ul>
  );
}
