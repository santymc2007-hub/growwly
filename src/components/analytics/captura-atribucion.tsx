"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { capturarAtribucion } from "@/lib/analytics/atribucion";
import { registrarLlegada } from "@/lib/analytics/embudo";

/**
 * Guarda los parámetros de campaña de la URL en cada navegación. El
 * caso "llega de un anuncio y acepta el banner sin cambiar de página"
 * lo cubre CookieConsent al aplicar el consentimiento.
 *
 * Además cuenta la llegada (embudo propio, sin cookies) cuando la URL
 * trae parámetros de campaña.
 */
export function CapturaAtribucion() {
  const pathname = usePathname();
  useEffect(() => {
    capturarAtribucion();
    registrarLlegada();
  }, [pathname]);
  return null;
}
