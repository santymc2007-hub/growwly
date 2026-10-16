"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { capturarAtribucion } from "@/lib/analytics/atribucion";

/**
 * Guarda los parámetros de campaña de la URL en cada navegación. El
 * caso "llega de un anuncio y acepta el banner sin cambiar de página"
 * lo cubre CookieConsent al aplicar el consentimiento.
 */
export function CapturaAtribucion() {
  const pathname = usePathname();
  useEffect(() => {
    capturarAtribucion();
  }, [pathname]);
  return null;
}
