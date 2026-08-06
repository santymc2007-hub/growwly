import Link from "next/link";
import { registrarPaciente } from "./actions";

type SearchParams = { error?: string };

export default async function RegistroPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { error } = await searchParams;

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6 py-12">
      <p className="text-sm uppercase tracking-[0.2em] text-ink-soft">
        Growwly
      </p>
      <h1 className="mt-2 font-display text-2xl text-teal-dark">
        Crea tu cuenta
      </h1>
      <p className="mt-1 text-sm text-ink-soft">
        Para guardar tu análisis y pedir presupuesto a clínicas.
      </p>

      <form action={registrarPaciente} className="mt-8 flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="nombre" className="text-sm font-medium text-ink">
              Nombre
            </label>
            <input
              id="nombre"
              name="nombre"
              required
              className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-teal/30"
            />
          </div>
          <div>
            <label
              htmlFor="apellidos"
              className="text-sm font-medium text-ink"
            >
              Apellidos
            </label>
            <input
              id="apellidos"
              name="apellidos"
              className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-teal/30"
            />
          </div>
        </div>

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

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="telefono"
              className="text-sm font-medium text-ink"
            >
              Teléfono
            </label>
            <input
              id="telefono"
              name="telefono"
              className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-teal/30"
            />
          </div>
          <div>
            <label htmlFor="edad" className="text-sm font-medium text-ink">
              Edad
            </label>
            <input
              id="edad"
              name="edad"
              type="number"
              min="16"
              max="100"
              className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-teal/30"
            />
          </div>
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
          Crear cuenta
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-soft">
        ¿Ya tienes cuenta?{" "}
        <Link href="/cuenta/login" className="font-medium text-cyan hover:text-cyan-dark">
          Inicia sesión
        </Link>
      </p>
    </main>
  );
}
