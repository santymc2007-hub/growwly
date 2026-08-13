import Link from "next/link";

export default function ClinicaNotFound() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-24 text-center">
      <h1 className="font-display text-2xl text-teal-dark">
        No encontramos esta clínica
      </h1>
      <p className="mt-3 text-ink-soft">
        Puede que el enlace esté roto o que la clínica ya no esté en el
        directorio.
      </p>
      <Link
        href="/clinicas"
        className="mt-6 inline-block text-sm font-medium text-cyan hover:text-cyan-dark"
      >
        ← Volver al listado
      </Link>
    </main>
  );
}
