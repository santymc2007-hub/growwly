"use client";

import { EVENTO_ABRIR_PREFERENCIAS } from "@/components/analytics/cookie-consent";

export function BotonPreferenciasCookies() {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event(EVENTO_ABRIR_PREFERENCIAS))}
      className="text-left hover:text-teal"
    >
      Preferencias de cookies
    </button>
  );
}
