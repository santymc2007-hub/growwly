"use client";

import type { AnchorHTMLAttributes } from "react";
import { trackEvent } from "@/lib/analytics/events";

/**
 * Como TrackedLink, pero además guarda el clic en nuestra propia base
 * de datos (clinic_contact_clicks) — para las estadísticas de
 * clínica/admin no queremos depender solo de Google Analytics: ni de
 * que el visitante acepte las cookies, ni de bloqueadores de anuncios.
 */
export function BotonContactoClinica({
  clinicId,
  metodo,
  onClick,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement> & {
  clinicId: string;
  metodo: "llamar" | "whatsapp" | "web" | "reserva_online" | "ver_mapa";
}) {
  return (
    <a
      {...props}
      onClick={(e) => {
        // "Ver en el mapa" no es un contacto: evento propio en Analytics
        // para que no infle clic_contacto_clinica (que se mide como
        // conversión). En nuestra base de datos sigue igual.
        if (metodo === "ver_mapa") {
          trackEvent("clic_ver_mapa", { clinic_id: clinicId });
        } else {
          trackEvent("clic_contacto_clinica", { clinic_id: clinicId, metodo });
        }
        fetch("/api/track/contacto-clinica", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ clinicId, metodo }),
          keepalive: true,
        }).catch(() => {});
        onClick?.(e);
      }}
    />
  );
}
