import Link from "next/link";
import { iniciarSesionClinica } from "./actions";
import { AuthCard } from "@/components/auth/auth-card";
import { BotonGoogle } from "@/components/auth/boton-google";
import { authBoton, authEnlace, authInput, authLabel, authTitulo } from "@/components/auth/estilos";

type SearchParams = { error?: string; next?: string };

export default async function LoginClinicaPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { error, next } = await searchParams;

  return (
    <AuthCard variant="clinica">
      <h1 className={authTitulo}>
        Inicia sesión
      </h1>

      <BotonGoogle origen="login" area="clinica" />

      <form
        action={iniciarSesionClinica}
        className="mt-6 flex flex-col gap-4"
      >
        {next && <input type="hidden" name="next" value={next} />}
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

        <div>
          <label htmlFor="password" className={authLabel}>
            Contraseña
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className={authInput}
          />
          <Link
            href="/clinica/olvide-password"
            className="mt-2 inline-block text-xs font-semibold text-cyan-dark hover:underline"
          >
            ¿Olvidaste tu contraseña?
          </Link>
        </div>

        {error && (
          <p className="text-sm text-error">{decodeURIComponent(error)}</p>
        )}

        <button
          type="submit"
          className={authBoton}
        >
          Entrar
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-soft">
        ¿Todavía no tienes cuenta?{" "}
        <Link
          href="/clinica/registro"
          className={authEnlace}
        >
          Regístrate
        </Link>
      </p>
    </AuthCard>
  );
}
