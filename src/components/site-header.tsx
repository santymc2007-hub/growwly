import Image from "next/image";
import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="border-b border-line bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
        <Link href="/clinicas" className="flex items-center">
          <Image
            src="/brand/growwly-logo-light-bg.png"
            alt="Growwly — Hair we go!"
            width={160}
            height={40}
            className="h-8 w-auto sm:h-9"
            priority
          />
        </Link>
        <nav className="flex gap-6 text-sm font-medium text-ink-soft">
          <Link href="/clinicas" className="hover:text-teal">
            Clínicas
          </Link>
        </nav>
      </div>
    </header>
  );
}
