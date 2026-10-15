"use client";

import Link from "next/link";
import Script from "next/script";
import { useEffect, useState, useSyncExternalStore } from "react";

const GA_MEASUREMENT_ID = "G-20S7PBB85Z";
const STORAGE_KEY = "growwly_consent_analytics_v1";

type Eleccion = "aceptado" | "rechazado" | null;

// Evento que dispara el enlace "Preferencias de cookies" del footer
// para poder reabrir este aviso y cambiar de opinión más tarde.
export const EVENTO_ABRIR_PREFERENCIAS = "growwly:abrir-preferencias-cookies";
const EVENTO_CONSENTIMIENTO = "growwly:consentimiento-cookies";

function suscribirseAConsentimiento(callback: () => void) {
  window.addEventListener(EVENTO_CONSENTIMIENTO, callback);
  return () => window.removeEventListener(EVENTO_CONSENTIMIENTO, callback);
}

const VALIDEZ_MS = 24 * 30 * 24 * 60 * 60 * 1000; // ~24 meses

function leerConsentimiento(): Eleccion {
  try {
    const guardada = localStorage.getItem(STORAGE_KEY);
    if (guardada !== "aceptado" && guardada !== "rechazado") return null;
    // Elecciones sin fecha (anteriores a oct 2026) siguen valiendo hasta
    // que la persona vuelva a elegir; con fecha, caducan a los ~24 meses.
    const fecha = localStorage.getItem(`${STORAGE_KEY}_fecha`);
    if (fecha && Date.now() - new Date(fecha).getTime() > VALIDEZ_MS) return null;
    return guardada;
  } catch {
    return null;
  }
}

/** Borra las cookies de Google Analytics (_ga, _ga_*, _gid) del dominio. */
function borrarCookiesAnalitica() {
  const nombres = document.cookie
    .split(";")
    .map((c) => c.split("=")[0].trim())
    .filter((n) => n === "_ga" || n.startsWith("_ga_") || n === "_gid" || n === "_gat");
  const host = window.location.hostname;
  const partes = host.split(".");
  // GA las pone en el dominio "raíz" (p. ej. .growwly.es); se prueba
  // con el host y con cada dominio padre.
  const dominios = [host];
  for (let i = 1; i < partes.length - 1; i++) dominios.push("." + partes.slice(i).join("."));
  dominios.push("." + host);
  for (const nombre of nombres) {
    document.cookie = `${nombre}=; Max-Age=0; path=/`;
    for (const d of dominios) {
      document.cookie = `${nombre}=; Max-Age=0; path=/; domain=${d}`;
    }
  }
}

function leerConsentimientoServidor(): Eleccion {
  return null;
}

export function CookieConsent() {
  // Se lee con useSyncExternalStore (en vez de leerlo en un efecto y
  // volcarlo a estado a mano) para que React resuelva por sí mismo el
  // valor "desconocido" del render en servidor frente al real que hay
  // en localStorage del navegador, sin warnings de hidratación.
  const eleccion = useSyncExternalStore(
    suscribirseAConsentimiento,
    leerConsentimiento,
    leerConsentimientoServidor,
  );
  const [reabierta, setReabierta] = useState(false);

  useEffect(() => {
    const abrir = () => setReabierta(true);
    window.addEventListener(EVENTO_ABRIR_PREFERENCIAS, abrir);
    return () => window.removeEventListener(EVENTO_ABRIR_PREFERENCIAS, abrir);
  }, []);

  const visible = eleccion === null || reabierta;

  function elegir(valor: "aceptado" | "rechazado") {
    const habiaAceptado = eleccion === "aceptado";
    localStorage.setItem(STORAGE_KEY, valor);
    // Fecha de la elección: permite volver a preguntar pasado un tiempo
    // (la AEPD recomienda como mucho 24 meses).
    localStorage.setItem(`${STORAGE_KEY}_fecha`, new Date().toISOString());

    if (valor === "rechazado" && habiaAceptado) {
      // Retirar el consentimiento tiene que ser efectivo: borrar las
      // cookies de Google Analytics y recargar para que el script ya
      // cargado deje de ejecutarse (auditoría oct 2026).
      borrarCookiesAnalitica();
      window.location.reload();
      return;
    }

    window.dispatchEvent(new Event(EVENTO_CONSENTIMIENTO));
    setReabierta(false);
  }

  return (
    <>
      {eleccion === "aceptado" && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
            strategy="afterInteractive"
          />
          <Script id="ga4-init" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              // Consent Mode v2: este script solo carga si se aceptaron
              // las cookies analíticas, así que analytics_storage va
              // concedido; publicidad siempre denegada hasta que exista
              // una categoría "Publicidad" en el banner (antes de poner
              // el píxel de Google Ads o Meta).
              gtag('consent', 'default', {
                analytics_storage: 'granted',
                ad_storage: 'denied',
                ad_user_data: 'denied',
                ad_personalization: 'denied'
              });
              gtag('js', new Date());
              gtag('config', '${GA_MEASUREMENT_ID}', { anonymize_ip: true });
            `}
          </Script>
        </>
      )}

      {visible && (
        <div
          role="dialog"
          aria-label="Preferencias de cookies"
          className="fixed inset-x-4 bottom-4 z-[100] mx-auto flex max-w-2xl flex-col gap-3 rounded-2xl border border-line bg-white p-5 shadow-xl sm:flex-row sm:items-center sm:gap-4"
        >
          <p className="flex-1 text-sm text-ink-soft">
            Usamos cookies analíticas (Google Analytics) para entender cómo se
            usa Growwly y mejorar el sitio. Solo las activamos si nos das tu
            consentimiento.{" "}
            <Link href="/legal/cookies" className="font-medium text-cyan-dark hover:underline">
              Más información
            </Link>
          </p>
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              onClick={() => elegir("rechazado")}
              className="press rounded-lg border border-line px-4 py-2 text-sm font-medium text-ink hover:border-ink/40"
            >
              Rechazar
            </button>
            <button
              type="button"
              onClick={() => elegir("aceptado")}
              className="press rounded-lg bg-teal-dark px-4 py-2 text-sm font-medium text-white hover:bg-teal"
            >
              Aceptar
            </button>
          </div>
        </div>
      )}
    </>
  );
}
