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

function leerConsentimiento(): Eleccion {
  const guardada = localStorage.getItem(STORAGE_KEY);
  return guardada === "aceptado" || guardada === "rechazado" ? guardada : null;
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
    localStorage.setItem(STORAGE_KEY, valor);
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
