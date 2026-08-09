import Image from "next/image";
import Link from "next/link";
import { User, Store } from "lucide-react";
import { MobileMenu } from "./mobile-menu";

export function SiteHeader() {
  return (
    <header className="relative border-b border-line bg-white">
      <div className="mx-auto flex max-w-[1600px] items-center justify-between px-6 py-3">
        <Link href="/" className="flex items-center">
          <Image
            src="/brand/growwly-logo-light-bg.png"
            alt="Growwly — Hair we go!"
            width={160}
            height={40}
            className="h-8 w-auto sm:h-9"
            priority
          />
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-medium text-ink-soft md:flex">
          <Link href="/clinicas" className="hover:text-teal">
            Clínicas
          </Link>
          <Link href="/blog" className="hover:text-teal">
            Blog
          </Link>
          <Link href="/tratamientos" className="hover:text-teal">
            Tratamientos
          </Link>
          <Link href="/cuenta" className="flex items-center gap-1.5 hover:text-teal">
            <User size={16} aria-hidden />
            Mi cuenta
          </Link>
          <span className="h-4 w-px bg-line" aria-hidden />
          <Link
            href="/clinica/login"
            className="flex items-center gap-1.5 text-xs text-ink-soft/70 hover:text-cyan"
          >
            <Store size={14} aria-hidden />
            Acceso clínicas
          </Link>
        </nav>
        <MobileMenu />
      </div>
    </header>
  );
}
