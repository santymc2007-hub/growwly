"use client";

import type { AnchorHTMLAttributes } from "react";
import { trackEvent } from "@/lib/analytics/events";

type Parametros = Record<string, string | number | boolean | undefined>;

/**
 * <a> normal (navega igual, no hace preventDefault) que además manda
 * un evento a Analytics al pulsarlo — para enlaces que salen del sitio
 * (tel:, WhatsApp, web de la clínica) donde no tiene sentido esperar a
 * un page_view para saber que se usaron.
 */
export function TrackedLink({
  evento,
  parametros,
  onClick,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement> & {
  evento: string;
  parametros?: Parametros;
}) {
  return (
    <a
      {...props}
      onClick={(e) => {
        trackEvent(evento, parametros);
        onClick?.(e);
      }}
    />
  );
}
