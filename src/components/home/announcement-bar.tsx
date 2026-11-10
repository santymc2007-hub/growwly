import Link from "next/link";
import { CheckCircle2, Mail } from "lucide-react";

import { REDES_GROWWLY as REDES } from "@/lib/redes-growwly";

export function AnnouncementBar() {
  return (
    <div className="hidden bg-sage px-6 py-2 text-xs font-medium text-teal-dark sm:block">
      <div className="mx-auto flex max-w-[1400px] items-center justify-between">
        <span className="flex items-center gap-1.5">
          <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
          Directorio y comparador de clínicas capilares
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
