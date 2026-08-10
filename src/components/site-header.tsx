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
        <nav className="hidden items-center gap-7 text-sm font-medium text-ink md:flex">
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
            className="rounded-full border border-cyan/60 px-4 py-2 text-ink transition hover:border-cyan"
          >
            Mi cuenta
          </Link>
          <Link
            href="/clinica/login"
            className="rounded-full bg-[linear-gradient(90deg,#94ceb8,#66c6ec)] px-4 py-2 font-semibold text-ink transition hover:opacity-90"
          >
            Acceso Clínicas
          </Link>
        </nav>
        <MobileMenu />
      </div>
    </header>
  );
}
