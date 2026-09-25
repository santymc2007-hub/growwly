function Estrellas({ valor }: { valor: number }) {
  return (
    <span className="text-2xl text-yellow" aria-hidden>
      {Array.from({ length: 5 }, (_, i) => (i < Math.round(valor) ? "★" : "☆")).join("")}
    </span>
  );
}

function GoogleG() {
  return (
    <svg viewBox="0 0 48 48" className="h-7 w-7 shrink-0" aria-hidden>
      <path
        fill="#EA4335"
        d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.9 2.4 30.4 0 24 0 14.6 0 6.5 5.4 2.5 13.2l7.9 6.1C12.3 13.1 17.7 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.6c-.5 2.9-2.2 5.4-4.6 7l7.4 5.8c4.3-4 6.8-9.9 6.8-17.3z"
      />
      <path
        fill="#FBBC05"
        d="M10.4 19.3c-.5 1.5-.8 3.1-.8 4.7s.3 3.2.8 4.7l-7.9 6.1C.9 31.5 0 27.9 0 24s.9-7.5 2.5-10.8z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.4 0 11.9-2.1 15.8-5.7l-7.4-5.8c-2.1 1.4-4.9 2.3-8.4 2.3-6.3 0-11.7-3.6-13.6-8.7l-7.9 6.1C6.5 42.6 14.6 48 24 48z"
      />
    </svg>
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

  // Postgres devuelve las columnas "numeric" como string vía PostgREST
  // (para no perder precisión), aunque el tipo generado diga `number`.
  const valorGoogle = ratingGoogle != null ? Number(ratingGoogle) : null;
  const valorDoctoralia =
    ratingDoctoralia != null ? Number(ratingDoctoralia) : null;

  return (
    <div className="rounded-3xl border border-yellow/40 bg-gradient-to-br from-yellow/20 via-white to-orange/10 p-6 shadow-sm">
      {valorGoogle != null && (
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Estrellas valor={valorGoogle} />
            <div>
              <p className="font-display text-2xl font-extrabold leading-none text-teal-dark">
                {valorGoogle.toFixed(1)}
              </p>
              <p className="mt-0.5 text-xs text-ink-soft">
                Google
                {resenasGoogle != null && ` · ${resenasGoogle} reseñas`}
              </p>
            </div>
          </div>
          <GoogleG />
        </div>
      )}
      {valorDoctoralia != null && (
        <div className="mt-4 flex items-center gap-3 border-t border-yellow/30 pt-4">
          <Estrellas valor={valorDoctoralia} />
          <div>
            <p className="font-display text-2xl font-extrabold leading-none text-teal-dark">
              {valorDoctoralia.toFixed(1)}
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
