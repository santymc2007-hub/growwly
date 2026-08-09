import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-paper-dim">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 py-6 text-xs text-ink-soft sm:flex-row">
        <p>© {new Date().getFullYear()} Growwly</p>
        <nav className="flex flex-wrap justify-center gap-x-4 gap-y-1">
          <Link href="/legal/aviso-legal" className="hover:text-teal">
            Aviso Legal
          </Link>
          <Link href="/legal/privacidad" className="hover:text-teal">
            Privacidad
          </Link>
          <Link href="/legal/cookies" className="hover:text-teal">
            Cookies
          </Link>
          <Link href="/legal/terminos" className="hover:text-teal">
            Términos y Condiciones
          </Link>
        </nav>
      </div>
    </footer>
  );
}
