import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

const PAGINAS = [
  { href: "/legal/aviso-legal", label: "Aviso Legal" },
  { href: "/legal/privacidad", label: "Privacidad" },
  { href: "/legal/cookies", label: "Cookies" },
  { href: "/legal/terminos", label: "Términos y Condiciones" },
];

export function LegalLayout({
  activo,
  children,
}: {
  activo: string;
  children: React.ReactNode;
}) {
  return (
    <main className="flex-1">
      <SiteHeader />
      <div className="mx-auto max-w-3xl px-6 py-12">
        <nav className="flex flex-wrap gap-x-5 gap-y-2 border-b border-line pb-4 text-sm">
          {PAGINAS.map((p) => (
            <Link
              key={p.href}
              href={p.href}
              className={
                p.href === activo
                  ? "font-medium text-teal-dark"
                  : "text-ink-soft hover:text-teal"
              }
            >
              {p.label}
            </Link>
          ))}
        </nav>
        <article className="prose prose-teal mt-8 max-w-none prose-headings:font-display prose-headings:text-teal-dark prose-a:text-cyan">
          {children}
        </article>
      </div>
      <SiteFooter />
    </main>
  );
}
