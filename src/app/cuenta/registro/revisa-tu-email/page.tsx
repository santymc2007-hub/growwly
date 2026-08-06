import Link from "next/link";

export default function RevisaTuEmailPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col items-center justify-center px-6 text-center">
      <h1 className="font-display text-2xl text-teal-dark">
        Revisa tu email
      </h1>
      <p className="mt-3 text-sm text-ink-soft">
        Te hemos enviado un enlace para confirmar tu cuenta. Ábrelo y ya
        podrás iniciar sesión.
      </p>
      <Link
        href="/cuenta/login"
        className="mt-6 text-sm font-medium text-cyan hover:text-cyan-dark"
      >
        Ir a iniciar sesión
      </Link>
    </main>
  );
}
