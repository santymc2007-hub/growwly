import Image from "next/image";
import type { ReactNode } from "react";

type Variant = "clinica" | "paciente" | "admin";

const VARIANTE: Record<
  Variant,
  { etiqueta: string; fondo: string }
> = {
  clinica: {
    etiqueta: "GROWWLY PARA CLÍNICAS",
    fondo:
      "radial-gradient(circle at top, color-mix(in srgb, var(--color-cyan) 25%, transparent), transparent 60%), linear-gradient(160deg, color-mix(in srgb, var(--color-teal) 15%, transparent), var(--color-paper) 55%)",
  },
  paciente: {
    etiqueta: "GROWWLY",
    fondo:
      "radial-gradient(circle at top, var(--color-sage), transparent 60%), linear-gradient(160deg, color-mix(in srgb, var(--color-cyan) 15%, transparent), var(--color-paper) 55%)",
  },
  admin: {
    etiqueta: "GROWWLY ADMIN",
    fondo:
      "radial-gradient(circle at top, color-mix(in srgb, var(--color-teal) 20%, transparent), transparent 60%), linear-gradient(160deg, var(--color-paper-dim), var(--color-paper) 55%)",
  },
};

export function AuthCard({
  variant,
  children,
}: {
  variant: Variant;
  children: ReactNode;
}) {
  const { etiqueta, fondo } = VARIANTE[variant];

  return (
    <main
      className="flex min-h-screen items-center justify-center px-6 py-12"
      style={{ backgroundImage: fondo }}
    >
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-xl shadow-teal/5">
        <Image
          src="/brand/growwly-logo-light-bg.png"
          alt="Growwly"
          width={130}
          height={33}
          className="h-7 w-auto"
        />
        <p className="mt-4 text-xs font-medium uppercase tracking-[0.2em] text-ink-soft">
          {etiqueta}
        </p>
        {children}
      </div>
    </main>
  );
}
