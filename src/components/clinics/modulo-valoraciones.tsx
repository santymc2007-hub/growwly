function Estrellas({ valor }: { valor: number }) {
  return (
    <span className="text-2xl text-yellow" aria-hidden>
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
    <div className="rounded-3xl border border-yellow/40 bg-gradient-to-br from-yellow/20 via-white to-orange/10 p-6 shadow-sm">
      {ratingGoogle != null && (
        <div className="flex items-center gap-3">
          <Estrellas valor={ratingGoogle} />
          <div>
            <p className="font-display text-2xl font-extrabold leading-none text-teal-dark">
              {ratingGoogle.toFixed(1)}
            </p>
            <p className="mt-0.5 text-xs text-ink-soft">
              Google
              {resenasGoogle != null && ` · ${resenasGoogle} reseñas`}
            </p>
          </div>
        </div>
      )}
      {ratingDoctoralia != null && (
        <div className="mt-4 flex items-center gap-3 border-t border-yellow/30 pt-4">
          <Estrellas valor={ratingDoctoralia} />
          <div>
            <p className="font-display text-2xl font-extrabold leading-none text-teal-dark">
              {ratingDoctoralia.toFixed(1)}
            </p>
            <p className="mt-0.5 text-xs text-ink-soft">
              Doctoralia
              {resenasDoctoralia != null && ` · ${resenasDoctoralia} reseñas`}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
