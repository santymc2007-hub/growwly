"use client";

import { useEffect, useState } from "react";

type Tipo = "exito" | "error";

/**
 * Aviso flotante que confirma si algo se ha guardado bien o ha
 * fallado. Fijo en pantalla (no depende de estar arriba del todo de
 * la página) y se cierra solo — pásale un `key` distinto en cada
 * aparición (p. ej. un timestamp) para que se reinicie el aviso
 * aunque el mensaje sea idéntico al anterior.
 */
export function Toast({ tipo, mensaje }: { tipo: Tipo; mensaje: string }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setVisible(false), 5000);
    return () => clearTimeout(t);
  }, []);

  if (!visible) return null;

  return (
    <div
      role="status"
      className={`toast-anim fixed inset-x-4 bottom-6 z-50 mx-auto flex max-w-sm items-start gap-3 rounded-xl px-4 py-3 text-sm shadow-lg sm:inset-x-auto sm:right-6 ${
        tipo === "exito"
          ? "bg-sage text-sage-ink"
          : "bg-error/10 text-error-dark"
      }`}
    >
      <p className="flex-1">{mensaje}</p>
      <button
        type="button"
        onClick={() => setVisible(false)}
        aria-label="Cerrar aviso"
        className="shrink-0 text-current/70 hover:text-current"
      >
        ✕
      </button>
    </div>
  );
}
