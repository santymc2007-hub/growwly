import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { FondoTextura } from "@/components/fondo-textura";
import { Breadcrumbs } from "@/components/breadcrumbs";

// Los enlaces entre textos legales están en el pie de todas las páginas.
const TITULOS: Record<string, string> = {
  "/legal/aviso-legal": "Aviso Legal",
  "/legal/privacidad": "Privacidad",
  "/legal/cookies": "Cookies",
  "/legal/terminos": "Términos y Condiciones",
  "/como-ordenamos": "Cómo ordenamos",
};

export function LegalLayout({
  activo,
  children,
}: {
  activo: string;
  children: React.ReactNode;
}) {
  return (
    <main className="relative flex-1">
      <FondoTextura />
      <SiteHeader />
      <div className="mx-auto max-w-4xl px-6 pt-8">
        <Breadcrumbs items={[{ label: TITULOS[activo] ?? "Legal", href: activo }]} />
      </div>
      <div className="mx-auto max-w-4xl px-3 pb-10 pt-4 sm:px-6">
        <div className="rounded-3xl bg-white px-6 py-10 shadow-sm sm:px-12 sm:py-12">
          <article className="prose prose-teal max-w-none prose-headings:font-display prose-headings:text-teal-dark prose-a:text-cyan">
            {children}
          </article>
        </div>
      </div>
      <SiteFooter />
    </main>
  );
}
