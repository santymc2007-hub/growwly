import { AuthCard } from "./auth-card";
import { actualizarPasswordRecuperada } from "@/lib/auth/actions-recuperacion";

type Seccion = "cuenta" | "clinica" | "admin";

const VARIANTE: Record<Seccion, "paciente" | "clinica" | "admin"> = {
  cuenta: "paciente",
  clinica: "clinica",
  admin: "admin",
};

export function RestablecerPasswordForm({
  seccion,
  error,
}: {
  seccion: Seccion;
  error?: string;
}) {
  const action = actualizarPasswordRecuperada.bind(null, seccion);

  return (
    <AuthCard variant={VARIANTE[seccion]}>
      <h1 className="mt-2 font-display text-2xl text-teal-dark">
        Crea una nueva contraseña
      </h1>

      <form action={action} className="mt-8 flex flex-col gap-4">
        <div>
          <label htmlFor="password" className="text-sm font-medium text-ink">
            Nueva contraseña
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="new-password"
            className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-teal/30"
          />
        </div>
        <div>
          <label htmlFor="password2" className="text-sm font-medium text-ink">
            Repite la contraseña
          </label>
          <input
            id="password2"
            name="password2"
            type="password"
            required
            autoComplete="new-password"
            className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-teal/30"
          />
        </div>

        {error && (
          <p className="text-sm text-error">{decodeURIComponent(error)}</p>
        )}

        <button
          type="submit"
          className="mt-2 rounded-lg bg-teal px-4 py-2 text-sm font-medium text-paper transition hover:bg-teal-dark"
        >
          Guardar contraseña
        </button>
      </form>
    </AuthCard>
  );
}
