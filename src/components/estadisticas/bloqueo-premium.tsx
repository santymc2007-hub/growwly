import Link from "next/link";
import { Lock } from "lucide-react";

/**
 * Envuelve un bloque de estadísticas de leads para clínicas básicas:
 * se ve la forma del dato (en gris, sin cifras reales) con un aviso
 * para pasar a PREMIUM encima. El objetivo es que se le "haga la boca
 * agua" — no ocultarlo sin más.
 */
export function BloqueoPremium({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative">
      <div
        aria-hidden
        className="pointer-events-none select-none grayscale opacity-40 blur-[1px]"
      >
        {children}
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-2xl bg-white/60 px-4 text-center">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-teal-dark text-white">
          <Lock className="h-4 w-4" strokeWidth={2.2} />
        </span>
        <p className="text-sm font-semibold text-teal-dark">Solo con perfil PREMIUM</p>
        <Link
          href="/clinica/visibilidad"
          className="press rounded-full bg-gradient-to-r from-brand-green to-brand-blue px-4 py-1.5 text-xs font-bold text-teal-dark transition hover:opacity-90"
        >
          Ver cómo activarlo
        </Link>
      </div>
    </div>
  );
}
