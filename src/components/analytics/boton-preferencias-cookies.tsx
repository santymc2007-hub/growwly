"use client";

import { EVENTO_ABRIR_PREFERENCIAS } from "@/components/analytics/cookie-consent";

export function BotonPreferenciasCookies({
  className = "text-left hover:text-white",
  children = "Preferencias de cookies",
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event(EVENTO_ABRIR_PREFERENCIAS))}
      className={className}
    >
      {children}
    </button>
  );
}
