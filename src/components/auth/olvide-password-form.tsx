import Link from "next/link";
import { AuthCard } from "./auth-card";
import { solicitarRecuperacion } from "@/lib/auth/actions-recuperacion";

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
      <h1 className="mt-2 font-display text-2xl text-teal-dark">
        ¿Olvidaste tu contraseña?
      </h1>
      <p className="mt-1 text-sm text-ink-soft">
        Te mandamos un enlace por email para crear una nueva.
      </p>

      {enviado ? (
        <p className="mt-6 rounded-lg bg-sage px-4 py-3 text-sm text-sage-ink">
          Si ese email tiene una cuenta, te hemos mandado un enlace — revisa
          tu bandeja de entrada (y la carpeta de spam, por si acaso).
        </p>
      ) : (
        <form action={solicitarRecuperacion} className="mt-8 flex flex-col gap-4">
          <input type="hidden" name="seccion" value={seccion} />
          <div>
            <label htmlFor="email" className="text-sm font-medium text-ink">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
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
            Enviar enlace
          </button>
        </form>
      )}

      <p className="mt-6 text-center text-sm text-ink-soft">
        <Link
          href={LOGIN_HREF[seccion]}
          className="font-medium text-cyan hover:text-cyan-dark"
        >
          ← Volver a iniciar sesión
        </Link>
      </p>
    </AuthCard>
  );
}
