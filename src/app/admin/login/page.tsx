import Link from "next/link";
import { login } from "./actions";
import { AuthCard } from "@/components/auth/auth-card";
import { authBoton, authInput, authLabel, authTitulo } from "@/components/auth/estilos";

type SearchParams = { error?: string };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { error } = await searchParams;

  return (
    <AuthCard variant="admin">
      <h1 className={authTitulo}>
        Acceso al panel
      </h1>
      <p className="mt-1 text-sm text-ink-soft">
        Solo para gestión interna de clínicas.
      </p>

      <form action={login} className="mt-6 flex flex-col gap-4">
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
            href="/admin/olvide-password"
            className="mt-2 inline-block text-xs font-semibold text-cyan-dark hover:underline"
          >
            ¿Olvidaste tu contraseña?
          </Link>
        </div>

        {error && <p className="text-sm text-error">{decodeURIComponent(error)}</p>}

        <button
          type="submit"
          className={authBoton}
        >
          Entrar
        </button>
      </form>
    </AuthCard>
  );
}
