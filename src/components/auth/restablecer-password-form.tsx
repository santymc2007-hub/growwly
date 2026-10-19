import { AuthCard } from "./auth-card";
import { actualizarPasswordRecuperada } from "@/lib/auth/actions-recuperacion";
import { authBoton, authInput, authLabel, authTitulo } from "@/components/auth/estilos";

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
      <h1 className={authTitulo}>
        Crea una nueva contraseña
      </h1>

      <form action={action} className="mt-6 flex flex-col gap-4">
        <div>
          <label htmlFor="password" className={authLabel}>
            Nueva contraseña
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="new-password"
            className={authInput}
          />
        </div>
        <div>
          <label htmlFor="password2" className={authLabel}>
            Repite la contraseña
          </label>
          <input
            id="password2"
            name="password2"
            type="password"
            required
            autoComplete="new-password"
            className={authInput}
          />
        </div>

        {error && (
          <p className="text-sm text-error">{decodeURIComponent(error)}</p>
        )}

        <button
          type="submit"
          className={authBoton}
        >
          Guardar contraseña
        </button>
      </form>
    </AuthCard>
  );
}
