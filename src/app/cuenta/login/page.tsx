import Link from "next/link";
import { iniciarSesionPaciente } from "./actions";

type SearchParams = { error?: string };

export default async function CuentaLoginPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { error } = await searchParams;

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6">
      <p className="text-sm uppercase tracking-[0.2em] text-ink-soft">
        Growwly
      </p>
      <h1 className="mt-2 font-display text-2xl text-teal-dark">
        Inicia sesión
      </h1>

      <form
        action={iniciarSesionPaciente}
        className="mt-8 flex flex-col gap-4"
      >
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
          href="/cuenta/registro"
          className="font-medium text-cyan hover:text-cyan-dark"
        >
          Regístrate
        </Link>
      </p>
    </main>
  );
}
