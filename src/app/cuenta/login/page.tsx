import Link from "next/link";
import { iniciarSesionPaciente } from "./actions";
import { AuthCard } from "@/components/auth/auth-card";
import { BotonGoogle } from "@/components/auth/boton-google";
import { authBoton, authEnlace, authInput, authLabel, authTitulo } from "@/components/auth/estilos";

type SearchParams = { error?: string; claim?: string };

export default async function CuentaLoginPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { error, claim } = await searchParams;

  return (
    <AuthCard variant="paciente">
      <h1 className={authTitulo}>
        Inicia sesión
      </h1>
      {claim && (
        <p className="mt-1 text-sm text-ink-soft">
          Un último paso para ver tu análisis capilar.
        </p>
      )}

      <BotonGoogle claim={claim} origen="login" />

      <form
        action={iniciarSesionPaciente}
        className="mt-6 flex flex-col gap-4"
      >
        {claim && <input type="hidden" name="claim" value={claim} />}
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
            href="/cuenta/olvide-password"
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
          href={claim ? `/cuenta/registro?claim=${claim}` : "/cuenta/registro"}
          className={authEnlace}
        >
          Regístrate
        </Link>
      </p>
    </AuthCard>
  );
}
