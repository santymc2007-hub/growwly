import Link from "next/link";
import { AuthCard } from "./auth-card";
import { solicitarRecuperacion } from "@/lib/auth/actions-recuperacion";
import { authBoton, authEnlace, authInput, authLabel, authTitulo } from "@/components/auth/estilos";

type Seccion = "cuenta" | "clinica" | "admin";

const VARIANTE: Record<Seccion, "paciente" | "clinica" | "admin"> = {
  cuenta: "paciente",
  clinica: "clinica",
  admin: "admin",
};

const LOGIN_HREF: Record<Seccion, string> = {
  cuenta: "/cuenta/login",
  clinica: "/clinica/login",
  admin: "/admin/login",
};

export function OlvidePasswordForm({
  seccion,
  enviado,
  error,
}: {
  seccion: Seccion;
  enviado?: string;
  error?: string;
}) {
  return (
    <AuthCard variant={VARIANTE[seccion]}>
      <h1 className={authTitulo}>
        ¿Olvidaste tu contraseña?
      </h1>
      <p className="mt-1 text-sm text-ink-soft">
        Te mandamos un enlace por email para crear una nueva.
      </p>

      {enviado ? (
        <p className="mt-6 rounded-xl bg-sage px-4 py-3 text-sm text-sage-ink">
          Si ese email tiene una cuenta, te hemos mandado un enlace — revisa
          tu bandeja de entrada (y la carpeta de spam, por si acaso).
        </p>
      ) : (
        <form action={solicitarRecuperacion} className="mt-6 flex flex-col gap-4">
          <input type="hidden" name="seccion" value={seccion} />
          <div>
            <label htmlFor="email" className={authLabel}>
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
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
            Enviar enlace
          </button>
        </form>
      )}

      <p className="mt-6 text-center text-sm text-ink-soft">
        <Link
          href={LOGIN_HREF[seccion]}
          className={authEnlace}
        >
          ← Volver a iniciar sesión
        </Link>
      </p>
    </AuthCard>
  );
}
