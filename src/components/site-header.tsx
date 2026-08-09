import Image from "next/image";
import Link from "next/link";
import { MobileMenu } from "./mobile-menu";

export function SiteHeader() {
  return (
    <header className="relative border-b border-line bg-white">
      <div className="mx-auto flex max-w-[1600px] items-center justify-between px-6 py-3">
        <Link href="/" className="flex items-center">
          <Image
            src="/brand/growwly-logo-gradient.png"
            alt="Growwly — Hair we go!"
            width={530}
            height={181}
            className="h-9 w-auto sm:h-10"
            priority
          />
        </Link>
        <nav className="hidden items-center gap-7 text-sm font-medium text-ink-soft md:flex">
          <Link href="/" className="hover:text-teal">
            Inicio
          </Link>
          <Link href="/#como-funciona" className="hover:text-teal">
            Como Funciona
          </Link>
          <Link href="/clinicas" className="hover:text-teal">
            Clínicas
          </Link>
          <Link href="/tratamientos" className="hover:text-teal">
            Tratamientos
          </Link>
          <Link href="/blog" className="hover:text-teal">
            Blog
          </Link>
          <Link
            href="/cuenta"
            className="rounded-full border border-line px-4 py-2 text-ink transition hover:border-teal hover:text-teal"
          >
            Mi cuenta
          </Link>
          <Link
            href="/clinica/login"
            className="rounded-full bg-teal px-4 py-2 text-paper transition hover:bg-teal-dark"
          >
            Acceso Clínicas
          </Link>
        </nav>
        <MobileMenu />
      </div>
    </header>
  );
}
