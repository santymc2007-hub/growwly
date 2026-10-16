import { GOOGLE_ADS_ID, GOOGLE_ADS_LEAD_LABEL } from "@/lib/cookies/config";

type ParametrosEvento = Record<string, string | number | boolean | undefined>;

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
  }
}

/**
 * Manda un evento a cada destino según el consentimiento del visitante
 * (ver CookieConsent):
 *
 * - Analíticas aceptadas → Google Analytics, con todos sus parámetros.
 * - Publicidad aceptada → solo los eventos que sirven para medir
 *   anuncios, a Google Ads y al píxel de Meta. Nunca con parámetros que
 *   digan algo de la salud del paciente (tratamientos, tipo de caída,
 *   ciudad…): a las plataformas de anuncios solo les llega qué tipo de
 *   acción ha sido.
 *
 * gtag puede existir también con solo publicidad aceptada (Google Ads),
 * por eso se mira el consentimiento y no solo que gtag exista.
 */
export function trackEvent(nombre: string, parametros?: ParametrosEvento) {
  if (typeof window === "undefined") return;
  const consentimiento = window.growwlyConsent;

  if (consentimiento?.analitica && window.gtag) {
    window.gtag("event", nombre, parametros);
  }
  if (consentimiento?.publicidad) {
    enviarAPublicidad(nombre, parametros);
  }
}

function enviarAPublicidad(nombre: string, parametros?: ParametrosEvento) {
  // Mismo id en Meta para cuando haya API de conversiones: así Meta
  // reconoce el evento repetido del servidor y no lo cuenta dos veces.
  const eventId =
    typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : undefined;

  switch (nombre) {
    case "generate_lead": {
      const tipo = typeof parametros?.tipo_lead === "string" ? parametros.tipo_lead : undefined;
      window.fbq?.("track", "Lead", tipo ? { content_name: tipo } : {}, eventId ? { eventID: eventId } : undefined);
      if (window.gtag && GOOGLE_ADS_ID && GOOGLE_ADS_LEAD_LABEL) {
        window.gtag("event", "conversion", { send_to: `${GOOGLE_ADS_ID}/${GOOGLE_ADS_LEAD_LABEL}` });
      }
      return;
    }
    case "analisis_completado":
      window.fbq?.("trackCustom", "ValoracionCompletada", {}, eventId ? { eventID: eventId } : undefined);
      return;
    case "sign_up":
      // Solo pacientes: el alta de clínicas es otro embudo (B2B).
      if (parametros?.tipo_cuenta === "paciente") {
        window.fbq?.("track", "CompleteRegistration", {}, eventId ? { eventID: eventId } : undefined);
      }
      return;
  }
}
