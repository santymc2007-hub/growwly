type ParametrosEvento = Record<string, string | number | boolean | undefined>;

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

/**
 * window.gtag solo existe si el visitante aceptó las cookies
 * analíticas (ver CookieConsent) — así que esto no manda nada sin
 * consentimiento, sin necesidad de comprobarlo aquí a mano.
 */
export function trackEvent(nombre: string, parametros?: ParametrosEvento) {
  if (typeof window === "undefined" || !window.gtag) return;
  window.gtag("event", nombre, parametros);
}
