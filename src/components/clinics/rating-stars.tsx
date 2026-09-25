function Estrellas({ valor }: { valor: number }) {
  return (
    <span className="text-[#f8b133]" aria-hidden>
      {Array.from({ length: 5 }, (_, i) => (i < Math.round(valor) ? "★" : "☆")).join("")}
    </span>
  );
}

/** Valoración compacta para tarjetas: estrellas + "4.5 / Google".
 *  No pinta nada si la clínica no tiene rating_google cargado. */
export function RatingCompacto({ rating }: { rating: number | null }) {
  if (rating == null) return null;
  // Postgres devuelve las columnas "numeric" como string vía PostgREST
  // (para no perder precisión), aunque el tipo generado diga `number`.
  const valor = Number(rating);
  return (
    <div className="flex shrink-0 items-center gap-1 text-xs">
      <Estrellas valor={valor} />
      <span className="font-medium text-ink">{valor.toFixed(1)} / Google</span>
    </div>
  );
}
