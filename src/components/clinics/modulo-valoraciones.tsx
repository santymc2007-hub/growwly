function Estrellas({ valor }: { valor: number }) {
  return (
    <span className="text-yellow" aria-hidden>
      {Array.from({ length: 5 }, (_, i) => (i < Math.round(valor) ? "★" : "☆")).join("")}
    </span>
  );
}

export function ModuloValoraciones({
  ratingGoogle,
  resenasGoogle,
  ratingDoctoralia,
  resenasDoctoralia,
}: {
  ratingGoogle: number | null;
  resenasGoogle: number | null;
  ratingDoctoralia: number | null;
  resenasDoctoralia: number | null;
}) {
  if (ratingGoogle == null && ratingDoctoralia == null) return null;

  return (
    <div className="rounded-3xl border border-line bg-white p-5">
      {ratingGoogle != null && (
        <div className="flex items-center gap-2">
          <Estrellas valor={ratingGoogle} />
          <span className="text-sm font-medium text-ink">
            {ratingGoogle.toFixed(1)} Google
          </span>
          {resenasGoogle != null && (
            <span className="text-xs text-ink-soft">({resenasGoogle} reseñas)</span>
          )}
        </div>
      )}
      {ratingDoctoralia != null && (
        <div className="mt-1.5 flex items-center gap-2">
          <Estrellas valor={ratingDoctoralia} />
          <span className="text-sm font-medium text-ink">
            {ratingDoctoralia.toFixed(1)} Doctoralia
          </span>
          {resenasDoctoralia != null && (
            <span className="text-xs text-ink-soft">({resenasDoctoralia} reseñas)</span>
          )}
        </div>
      )}
    </div>
  );
}
