type ParametrosEvento = Record<string, string | number | boolean | undefined>;

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

/**
 * Manda un evento a Google Analytics solo si el visitante aceptó las
 * cookies analíticas. gtag puede existir también con solo publicidad
 * aceptada (Google Ads), por eso se mira el consentimiento y no solo
 * que gtag exista (ver CookieConsent).
 */
export function trackEvent(nombre: string, parametros?: ParametrosEvento) {
  if (typeof window === "undefined" || !window.gtag) return;
  if (!window.growwlyConsent?.analitica) return;
  window.gtag("event", nombre, parametros);
}
