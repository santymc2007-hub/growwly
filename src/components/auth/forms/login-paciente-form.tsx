import Link from "next/link";
import { iniciarSesionPaciente } from "@/app/cuenta/login/actions";

export function LoginPacienteForm({
  error,
  claim,
}: {
  error?: string;
  claim?: string;
}) {
  return (
    <>
      <h1 className="mt-2 font-display text-2xl text-teal-dark">
        Inicia sesión
      </h1>
      {claim && (
        <p className="mt-1 text-sm text-ink-soft">
          Un último paso para ver tu análisis capilar.
        </p>
      )}

      <form
        action={iniciarSesionPaciente}
        className="mt-8 flex flex-col gap-4"
      >
        {claim && <input type="hidden" name="claim" value={claim} />}
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

        <div>
          <label htmlFor="password" className="text-sm font-medium text-ink">
            Contraseña
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
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
          Entrar
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-soft">
        ¿Todavía no tienes cuenta?{" "}
        <Link
          href={claim ? `/cuenta/registro?claim=${claim}` : "/cuenta/registro"}
          className="font-medium text-cyan hover:text-cyan-dark"
        >
          Regístrate
        </Link>
      </p>
    </>
  );
}
