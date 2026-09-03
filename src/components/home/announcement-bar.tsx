import Link from "next/link";
import { CheckCircle2, Mail } from "lucide-react";

// TODO: sustituir por los perfiles reales de Growwly en cuanto los tengas
// (Santy: "sí pon esas [redes] y ya veremos en adelante" — de momento
// apuntan a las home de cada red, no a una cuenta concreta).
const REDES = [
  {
    nombre: "Instagram",
    href: "https://instagram.com",
    path: "M12 2c2.7 0 3.06.01 4.12.06 1.06.05 1.79.22 2.43.47.66.26 1.21.6 1.76 1.15.55.55.9 1.1 1.15 1.76.25.64.42 1.37.47 2.43.05 1.06.06 1.42.06 4.12 0 2.7-.01 3.06-.06 4.12-.05 1.06-.22 1.79-.47 2.43a4.9 4.9 0 0 1-1.15 1.76 4.9 4.9 0 0 1-1.76 1.15c-.64.25-1.37.42-2.43.47-1.06.05-1.42.06-4.12.06-2.7 0-3.06-.01-4.12-.06-1.06-.05-1.79-.22-2.43-.47a4.9 4.9 0 0 1-1.76-1.15 4.9 4.9 0 0 1-1.15-1.76c-.25-.64-.42-1.37-.47-2.43C2.01 15.06 2 14.7 2 12c0-2.7.01-3.06.06-4.12.05-1.06.22-1.79.47-2.43.26-.66.6-1.21 1.15-1.76a4.9 4.9 0 0 1 1.76-1.15c.64-.25 1.37-.42 2.43-.47C8.94 2.01 9.3 2 12 2zm0 5a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm0 8.2a3.2 3.2 0 1 1 0-6.4 3.2 3.2 0 0 1 0 6.4zm5.2-8.4a1.17 1.17 0 1 1-2.34 0 1.17 1.17 0 0 1 2.34 0z",
  },
  {
    nombre: "Facebook",
    href: "https://facebook.com",
    path: "M13.5 21v-7.5h2.5l.4-3H13.5V8.4c0-.87.24-1.46 1.5-1.46h1.6V4.3C16.3 4.26 15.4 4.2 14.35 4.2c-2.2 0-3.7 1.34-3.7 3.8v2.5H8.1v3h2.55V21h2.85z",
  },
  {
    nombre: "TikTok",
    href: "https://tiktok.com",
    path: "M16.6 5.82c-.7-.77-1.09-1.77-1.09-2.82H12.7v13.7a2.62 2.62 0 1 1-1.86-2.5v-2.87a5.5 5.5 0 1 0 4.76 5.45V9.3a7.6 7.6 0 0 0 4.4 1.4V7.9a4.85 4.85 0 0 1-3.4-2.08z",
  },
] as const;

export function AnnouncementBar() {
  return (
    <div className="hidden bg-brand-green px-6 py-2 text-xs font-medium text-teal-dark sm:block">
      <div className="mx-auto flex max-w-[1600px] items-center justify-between">
        <span className="flex items-center gap-1.5">
          <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
          Directorio Nº1 de clínicas capilares verificadas
        </span>
        <div className="flex items-center gap-4">
          <a
            href="mailto:hola@growwly.es"
            className="flex items-center gap-1.5 hover:opacity-70"
          >
            <Mail className="h-3.5 w-3.5" aria-hidden />
            hola@growwly.es
          </a>
          <div className="flex items-center gap-2.5">
            {REDES.map(({ nombre, href, path }) => (
              <Link
                key={nombre}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={nombre}
                className="hover:opacity-70"
              >
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor" aria-hidden>
                  <path d={path} />
                </svg>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
