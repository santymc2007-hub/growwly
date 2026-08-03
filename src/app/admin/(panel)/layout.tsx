import Image from "next/image";
import Link from "next/link";
import { logout } from "./actions";

export default function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-paper-dim">
      <header className="border-b border-line bg-teal text-paper">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-5">
            <Image
              src="/brand/growwly-logo-dark-bg.png"
              alt="Growwly"
              width={130}
              height={33}
              className="h-7 w-auto"
              priority
            />
            <span className="rounded-full bg-white/15 px-2 py-0.5 text-xs font-medium tracking-wide text-paper/80">
              PANEL
            </span>
            <nav className="flex gap-4 text-sm">
              <Link href="/admin/clinicas" className="hover:text-cyan">
                Clínicas
              </Link>
            </nav>
          </div>
          <form action={logout}>
            <button
              type="submit"
              className="text-sm text-paper/80 hover:text-paper"
            >
              Cerrar sesión
            </button>
          </form>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10">{children}</main>
    </div>
  );
}
