import Link from "next/link";
import type { Metadata } from "next";
import { SearchX } from "lucide-react";
// Caveat solo se usa en esta página (acento manuscrito puntual) — igual
// que en la home, cargarla desde el layout raíz la mandaría a todo el sitio.
import "@fontsource/caveat/700.css";
import { SiteHeader } from "@/components/site-header";
import { FondoTextura } from "@/components/fondo-textura";
import { SiteFooter } from "@/components/site-footer";

export const metadata: Metadata = {
  title: "Página no encontrada",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <main className="relative flex-1">
      <FondoTextura />
      <SiteHeader />

      <div className="mx-auto max-w-[1400px] px-3 pb-8 sm:px-6 sm:pb-10">
        <div className="overflow-hidden rounded-3xl bg-white shadow-sm">
          <div className="flex flex-col items-center px-6 py-20 text-center sm:px-10 sm:py-28">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-sage text-sage-ink">
              <SearchX className="h-8 w-8" aria-hidden />
            </span>

            <p className="font-hand mt-6 text-3xl text-teal-dark sm:text-4xl">
              Vaya, esto se nos ha caído
            </p>
            <h1 className="mt-2 font-display text-6xl font-extrabold text-teal-dark sm:text-8xl">
              404
            </h1>
            <p className="mt-4 max-w-md text-base text-ink-soft sm:text-lg">
              La página que buscas no existe o se ha movido. Prueba a volver
              al inicio o echa un vistazo a nuestro directorio de clínicas.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/"
                className="press inline-block rounded-full bg-yellow px-6 py-3 font-display text-base font-bold text-teal-dark shadow-lg shadow-yellow/30 transition hover:opacity-90"
              >
                Volver al inicio
              </Link>
              <Link
                href="/clinicas"
                className="press inline-block rounded-full border border-line bg-white px-6 py-3 font-display text-base font-bold text-teal-dark transition hover:border-teal/40"
              >
                Ver clínicas
              </Link>
            </div>
          </div>
        </div>
      </div>

      <SiteFooter />
    </main>
  );
}
