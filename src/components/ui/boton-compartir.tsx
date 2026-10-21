"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Link2, Mail, MoreHorizontal, Send, Share2 } from "lucide-react";
import { trackEvent } from "@/lib/analytics/events";

type Red = {
  id: string;
  nombre: string;
  href: (url: string, texto: string) => string;
  icono: React.ReactNode;
};

// Iconos de marca simplificados (lucide no trae logos de marcas).
const IconoWhatsapp = (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
    <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.6.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.3-.4.8-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6a2.7 2.7 0 0 0 1.8-1.2 2.2 2.2 0 0 0 .1-1.3c0-.1-.2-.2-.4-.3Z" />
  </svg>
);
const IconoFacebook = (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
    <path d="M13.5 22v-8h2.7l.4-3.2h-3.1V8.8c0-.9.3-1.5 1.6-1.5h1.7V4.5a22 22 0 0 0-2.5-.1c-2.4 0-4.1 1.5-4.1 4.2v2.3H7.5V14h2.7v8h3.3Z" />
  </svg>
);
const IconoX = (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
    <path d="M17.8 3h3.1l-6.8 7.8L22 21h-6.3l-4.9-6.4L5.2 21H2.1l7.3-8.3L1.8 3h6.4l4.4 5.9L17.8 3Zm-1.1 16.2h1.7L7.4 4.7H5.6l11.1 14.5Z" />
  </svg>
);
const IconoLinkedin = (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
    <path d="M6.9 21H3.3V9h3.6v12ZM5.1 7.4a2.1 2.1 0 1 1 0-4.2 2.1 2.1 0 0 1 0 4.2ZM21 21h-3.6v-5.8c0-1.4 0-3.2-2-3.2s-2.2 1.5-2.2 3.1V21H9.6V9H13v1.6a3.8 3.8 0 0 1 3.4-1.9c3.6 0 4.3 2.4 4.3 5.5V21Z" />
  </svg>
);

const enc = encodeURIComponent;

const REDES: Red[] = [
  {
    id: "whatsapp",
    nombre: "WhatsApp",
    href: (u, t) => `https://wa.me/?text=${enc(`${t} ${u}`)}`,
    icono: IconoWhatsapp,
  },
  {
    id: "telegram",
    nombre: "Telegram",
    href: (u, t) => `https://t.me/share/url?url=${enc(u)}&text=${enc(t)}`,
    icono: <Send className="h-4 w-4" aria-hidden />,
  },
  {
    id: "facebook",
    nombre: "Facebook",
    href: (u) => `https://www.facebook.com/sharer/sharer.php?u=${enc(u)}`,
    icono: IconoFacebook,
  },
  {
    id: "x",
    nombre: "X",
    href: (u, t) => `https://twitter.com/intent/tweet?url=${enc(u)}&text=${enc(t)}`,
    icono: IconoX,
  },
  {
    id: "linkedin",
    nombre: "LinkedIn",
    href: (u) => `https://www.linkedin.com/sharing/share-offsite/?url=${enc(u)}`,
    icono: IconoLinkedin,
  },
  {
    id: "email",
    nombre: "Email",
    href: (u, t) => `mailto:?subject=${enc(t)}&body=${enc(`${t}\n\n${u}`)}`,
    icono: <Mail className="h-4 w-4" aria-hidden />,
  },
];

/**
 * Botón "Compartir" para fichas de centro, tratamientos y posts del
 * blog: menú con WhatsApp, Telegram, Facebook, X, LinkedIn, email,
 * copiar enlace y, si el navegador lo permite (móviles), el menú de
 * compartir nativo del sistema ("Más opciones").
 *
 * Comparte siempre la URL limpia de la página (sin parámetros de campaña
 * ni filtros), con `?utm_source=compartir` para poder medirlo.
 */
export function BotonCompartir({
  titulo,
  tipo,
  className = "",
}: {
  /** Texto que acompaña al enlace (nombre del centro, tratamiento…). */
  titulo: string;
  /** Qué se comparte, para analítica: "centro" | "tratamiento" | "post". */
  tipo: "centro" | "tratamiento" | "post";
  className?: string;
}) {
  const [abierto, setAbierto] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  // El menú solo se pinta en el cliente (tras el clic), así que aquí ya
  // se puede mirar navigator sin romper la hidratación.
  const nativo =
    abierto && typeof navigator !== "undefined" && typeof navigator.share === "function";

  useEffect(() => {
    if (!abierto) return;
    function fuera(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setAbierto(false);
    }
    function escape(e: KeyboardEvent) {
      if (e.key === "Escape") setAbierto(false);
    }
    document.addEventListener("mousedown", fuera);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("mousedown", fuera);
      document.removeEventListener("keydown", escape);
    };
  }, [abierto]);

  function urlCompartida(medio: string) {
    const u = new URL(window.location.pathname, window.location.origin);
    u.searchParams.set("utm_source", "compartir");
    u.searchParams.set("utm_medium", medio);
    return u.toString();
  }

  function registrar(medio: string) {
    trackEvent("share", { method: medio, content_type: tipo });
  }

  async function copiar() {
    const url = urlCompartida("copiar");
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // Navegadores sin portapapeles: selección manual como último recurso.
      window.prompt("Copia este enlace:", url);
    }
    registrar("copiar");
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  async function compartirNativo() {
    try {
      await navigator.share({ title: titulo, text: titulo, url: urlCompartida("nativo") });
      registrar("nativo");
      setAbierto(false);
    } catch {
      // El usuario canceló: no pasa nada.
    }
  }

  return (
    <div ref={ref} className={`relative inline-block ${className}`}>
      <button
        type="button"
        onClick={() => setAbierto((a) => !a)}
        aria-haspopup="menu"
        aria-expanded={abierto}
        className="press inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-3.5 py-1.5 text-sm font-semibold text-teal-dark shadow-sm transition hover:border-teal/40"
      >
        <Share2 className="h-4 w-4" aria-hidden />
        Compartir
      </button>

      {abierto && (
        // Móvil: fondo oscurecido (el menú sube desde abajo, como una hoja).
        <div
          aria-hidden
          onClick={() => setAbierto(false)}
          className="fixed inset-0 z-40 bg-ink/30 sm:hidden"
        />
      )}

      {abierto && (
        // Móvil: hoja anclada abajo a lo ancho (así nunca se sale de la
        // pantalla). Escritorio: desplegable bajo el botón.
        <div
          role="menu"
          className="popover-anim fixed inset-x-3 bottom-3 z-50 overflow-hidden rounded-2xl border border-line bg-white p-1.5 shadow-xl sm:absolute sm:inset-x-auto sm:bottom-auto sm:right-0 sm:mt-2 sm:w-56"
          style={{ transformOrigin: "top right" }}
        >
          {REDES.map((r) => (
            <a
              key={r.id}
              role="menuitem"
              href={r.href(
                typeof window === "undefined" ? "" : urlCompartida(r.id),
                titulo,
              )}
              target={r.id === "email" ? undefined : "_blank"}
              rel="noopener noreferrer"
              onClick={() => {
                registrar(r.id);
                setAbierto(false);
              }}
              className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-ink transition hover:bg-paper-dim"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-paper-dim text-teal-dark">
                {r.icono}
              </span>
              {r.nombre}
            </a>
          ))}

          <div className="my-1 h-px bg-line" />

          <button
            type="button"
            role="menuitem"
            onClick={copiar}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm text-ink transition hover:bg-paper-dim"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-paper-dim text-teal-dark">
              {copiado ? <Check className="h-4 w-4 text-green" aria-hidden /> : <Link2 className="h-4 w-4" aria-hidden />}
            </span>
            {copiado ? "¡Enlace copiado!" : "Copiar enlace"}
          </button>

          {nativo && (
            <button
              type="button"
              role="menuitem"
              onClick={compartirNativo}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm text-ink transition hover:bg-paper-dim"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-paper-dim text-teal-dark">
                <MoreHorizontal className="h-4 w-4" aria-hidden />
              </span>
              Más opciones…
            </button>
          )}
        </div>
      )}
    </div>
  );
}
