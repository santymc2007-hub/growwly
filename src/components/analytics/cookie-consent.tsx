"use client";

import Link from "next/link";
import Script from "next/script";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import {
  CLARITY_ID,
  GA_MEASUREMENT_ID,
  GOOGLE_ADS_ID,
  META_PIXEL_ID,
  PREFIJOS_ANALITICA,
  PREFIJOS_PUBLICIDAD,
  PUBLICIDAD_ACTIVA,
} from "@/lib/cookies/config";
import { CLAVE_ATRIBUCION, capturarAtribucion } from "@/lib/analytics/atribucion";

/**
 * Banner de cookies por categorías (auditoría oct 2026):
 * - Necesarias: siempre activas, no piden consentimiento.
 * - Analíticas: Google Analytics.
 * - Publicidad: Google Ads / Meta. Solo aparece si hay algún píxel
 *   configurado (ver lib/cookies/config.ts).
 *
 * Rechazar y Aceptar están al mismo nivel (guía de la AEPD); Configurar
 * abre el detalle por categoría. Nada se carga sin consentimiento, y
 * retirarlo borra las cookies de esa categoría y recarga la página.
 * Google recibe además las señales de Consent Mode v2.
 */

const STORAGE_KEY = "growwly_consent_v2";
const STORAGE_KEY_V1 = "growwly_consent_analytics_v1";
const VALIDEZ_MS = 24 * 30 * 24 * 60 * 60 * 1000; // ~24 meses

type Consentimiento = {
  analitica: boolean;
  /** null = todavía no se le ha preguntado (la categoría no existía). */
  publicidad: boolean | null;
  fecha: string;
};

// Evento que dispara el enlace "Preferencias de cookies" del footer
// para poder reabrir este aviso y cambiar de opinión más tarde.
export const EVENTO_ABRIR_PREFERENCIAS = "growwly:abrir-preferencias-cookies";
const EVENTO_CONSENTIMIENTO = "growwly:consentimiento-cookies";

declare global {
  interface Window {
    growwlyConsent?: { analitica: boolean; publicidad: boolean };
  }
}

function suscribirse(callback: () => void) {
  window.addEventListener(EVENTO_CONSENTIMIENTO, callback);
  return () => window.removeEventListener(EVENTO_CONSENTIMIENTO, callback);
}

/**
 * Devuelve el consentimiento guardado como texto (no como objeto):
 * useSyncExternalStore exige que la instantánea sea estable entre
 * llamadas, y un objeto nuevo en cada lectura provocaría bucles.
 */
function leerSnapshot(): string | null {
  try {
    const v2 = localStorage.getItem(STORAGE_KEY);
    if (v2) return v2;
    // Migración desde la versión con una sola casilla (analítica).
    const v1 = localStorage.getItem(STORAGE_KEY_V1);
    if (v1 === "aceptado" || v1 === "rechazado") {
      const migrado: Consentimiento = {
        analitica: v1 === "aceptado",
        publicidad: null,
        fecha: localStorage.getItem(`${STORAGE_KEY_V1}_fecha`) ?? new Date().toISOString(),
      };
      const texto = JSON.stringify(migrado);
      localStorage.setItem(STORAGE_KEY, texto);
      return texto;
    }
    return null;
  } catch {
    return null;
  }
}

// En el servidor (y durante la hidratación) no se sabe si ya decidió:
// se devuelve un marcador para NO pintar la franja. Si se devolviera
// null, el HTML llegaría con la franja visible y desaparecería al
// leer localStorage: un parpadeo en cada recarga.
const PENDIENTE = "__pendiente__";

function leerSnapshotServidor(): string | null {
  return PENDIENTE;
}

function parsear(texto: string | null): Consentimiento | null {
  if (!texto) return null;
  try {
    const c = JSON.parse(texto) as Consentimiento;
    if (typeof c.analitica !== "boolean" || !c.fecha) return null;
    if (Date.now() - new Date(c.fecha).getTime() > VALIDEZ_MS) return null;
    return c;
  } catch {
    return null;
  }
}

/** Borra del dominio las cookies cuyo nombre empieza por alguno de los prefijos. */
function borrarCookies(prefijos: string[]) {
  const nombres = document.cookie
    .split(";")
    .map((c) => c.split("=")[0].trim())
    .filter((n) => prefijos.some((p) => n.startsWith(p)));
  const host = window.location.hostname;
  const partes = host.split(".");
  // Google y Meta las ponen en el dominio "raíz" (p. ej. .growwly.es):
  // se prueba con el host y con cada dominio padre.
  const dominios = [host, "." + host];
  for (let i = 1; i < partes.length - 1; i++) dominios.push("." + partes.slice(i).join("."));
  for (const nombre of nombres) {
    document.cookie = `${nombre}=; Max-Age=0; path=/`;
    for (const d of dominios) {
      document.cookie = `${nombre}=; Max-Age=0; path=/; domain=${d}`;
    }
  }
}

export function CookieConsent() {
  const snapshot = useSyncExternalStore(suscribirse, leerSnapshot, leerSnapshotServidor);
  const consentimiento = useMemo(() => parsear(snapshot), [snapshot]);

  const [reabierta, setReabierta] = useState(false);
  const [configurando, setConfigurando] = useState(false);
  const [borradorAnalitica, setBorradorAnalitica] = useState(false);
  const [borradorPublicidad, setBorradorPublicidad] = useState(false);

  useEffect(() => {
    const abrir = () => {
      setReabierta(true);
      setConfigurando(true);
    };
    window.addEventListener(EVENTO_ABRIR_PREFERENCIAS, abrir);
    return () => window.removeEventListener(EVENTO_ABRIR_PREFERENCIAS, abrir);
  }, []);

  const analitica = consentimiento?.analitica === true;
  const publicidad = PUBLICIDAD_ACTIVA && consentimiento?.publicidad === true;

  useEffect(() => {
    window.growwlyConsent = { analitica, publicidad };
    // Quien llega de un anuncio suele aceptar el banner sin cambiar de
    // página: guardar ya los parámetros de campaña de esta URL.
    if (publicidad) capturarAtribucion();
  }, [analitica, publicidad]);

  // Hay que preguntar si no hay elección válida, o si ya hay anuncios y
  // esta persona decidió antes de que existiera la categoría.
  const faltaDecidir =
    consentimiento === null || (PUBLICIDAD_ACTIVA && consentimiento.publicidad === null);
  const visible = snapshot !== PENDIENTE && (faltaDecidir || reabierta);

  // Para que el botón flotante del buscador se coloque por encima de la
  // franja mientras esté visible (ver .lanzador-ia en globals.css).
  useEffect(() => {
    document.documentElement.dataset.cookieBanner = visible ? "1" : "0";
  }, [visible]);

  function abrirConfiguracion() {
    setBorradorAnalitica(analitica);
    setBorradorPublicidad(publicidad);
    setConfigurando(true);
  }

  function guardar(nuevaAnalitica: boolean, nuevaPublicidad: boolean) {
    const nuevo: Consentimiento = {
      analitica: nuevaAnalitica,
      publicidad: PUBLICIDAD_ACTIVA ? nuevaPublicidad : (consentimiento?.publicidad ?? null),
      fecha: new Date().toISOString(),
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nuevo));
      localStorage.removeItem(STORAGE_KEY_V1);
      localStorage.removeItem(`${STORAGE_KEY_V1}_fecha`);
    } catch {
      // Sin almacenamiento (modo privado estricto): la elección dura
      // solo esta visita, y no se carga nada que no se haya aceptado.
    }

    // Retirar un consentimiento tiene que ser efectivo: borrar sus
    // cookies y recargar para que los scripts ya cargados se detengan.
    const retiraAnalitica = analitica && !nuevaAnalitica;
    const retiraPublicidad = publicidad && !nuevaPublicidad;
    if (retiraAnalitica || retiraPublicidad) {
      if (retiraAnalitica) borrarCookies(PREFIJOS_ANALITICA);
      if (retiraPublicidad) {
        borrarCookies(PREFIJOS_PUBLICIDAD);
        try {
          localStorage.removeItem(CLAVE_ATRIBUCION);
        } catch {
          // Sin almacenamiento: no había nada guardado.
        }
      }
      window.location.reload();
      return;
    }

    window.dispatchEvent(new Event(EVENTO_CONSENTIMIENTO));
    setReabierta(false);
    setConfigurando(false);
  }

  const cargarGtag = analitica || (publicidad && Boolean(GOOGLE_ADS_ID));
  const idGtag = analitica ? GA_MEASUREMENT_ID : GOOGLE_ADS_ID;

  return (
    <>
      {cargarGtag && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${idGtag}`}
            strategy="afterInteractive"
          />
          <Script id="gtag-init" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('consent', 'default', {
                analytics_storage: '${analitica ? "granted" : "denied"}',
                ad_storage: '${publicidad ? "granted" : "denied"}',
                ad_user_data: '${publicidad ? "granted" : "denied"}',
                ad_personalization: '${publicidad ? "granted" : "denied"}'
              });
              gtag('js', new Date());
              ${analitica ? `gtag('config', '${GA_MEASUREMENT_ID}');` : ""}
              ${publicidad && GOOGLE_ADS_ID ? `gtag('config', '${GOOGLE_ADS_ID}');` : ""}
            `}
          </Script>
        </>
      )}

      {analitica && CLARITY_ID && (
        <Script id="clarity" strategy="afterInteractive">
          {`
            (function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
            t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
            y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
            })(window, document, "clarity", "script", "${CLARITY_ID}");
            window.clarity('consentv2', { ad_Storage: 'denied', analytics_Storage: 'granted' });
          `}
        </Script>
      )}

      {publicidad && META_PIXEL_ID && (
        <Script id="meta-pixel" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
            n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
            document,'script','https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${META_PIXEL_ID}');
            fbq('track', 'PageView');
          `}
        </Script>
      )}

      {visible && (
        // Franja a todo el ancho con el verde de la marca al 80 %: se ve,
        // pero deja intuir la página. Rechazar y Aceptar con el mismo peso
        // visual (criterio AEPD).
        <div
          role="dialog"
          aria-label="Preferencias de cookies"
          className="fixed inset-x-0 bottom-0 z-[110] bg-logo/80 text-white shadow-[0_-8px_30px_rgba(0,0,0,0.12)] backdrop-blur-md"
        >
          <div className="mx-auto max-w-[1400px] px-4 py-3 sm:px-6 sm:py-4">
          {!configurando ? (
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-6">
              <div className="flex flex-1 items-center gap-3 sm:gap-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/brand/icono-cookie.png"
                  alt=""
                  width={48}
                  height={48}
                  className="h-10 w-10 shrink-0 sm:h-12 sm:w-12"
                />
              <p className="flex-1 text-[13px] leading-snug text-white sm:text-sm">
                {PUBLICIDAD_ACTIVA
                  ? "Usamos cookies analíticas para entender cómo se usa Growwly y cookies de publicidad para medir nuestros anuncios. Solo las activamos si nos das tu consentimiento."
                  : "Usamos cookies analíticas para entender cómo se usa Growwly y mejorar el sitio. Solo las activamos si nos das tu consentimiento."}{" "}
                <Link href="/legal/cookies" className="font-semibold text-lima underline-offset-2 hover:underline">
                  Más información
                </Link>
              </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={abrirConfiguracion}
                  className="press mr-1 px-2 py-2 text-sm font-medium text-white/90 underline underline-offset-2 hover:text-white"
                >
                  Configurar
                </button>
                <button
                  type="button"
                  onClick={() => guardar(false, false)}
                  className="press flex-1 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-logo transition hover:bg-yellow md:flex-none"
                >
                  Rechazar
                </button>
                <button
                  type="button"
                  onClick={() => guardar(true, true)}
                  className="press flex-1 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-logo transition hover:bg-yellow md:flex-none"
                >
                  Aceptar
                </button>
              </div>
            </div>
          ) : (
            <div className="mx-auto max-h-[80vh] max-w-2xl overflow-y-auto rounded-2xl bg-white p-5 text-ink shadow-xl">
              <p className="flex items-center gap-2 font-display text-base font-bold text-teal-dark">
                Preferencias de cookies
              </p>
              <ul className="mt-3 flex flex-col gap-3 text-sm">
                <li className="flex items-start justify-between gap-4">
                  <span>
                    <span className="font-medium text-ink">Necesarias</span>
                    <span className="block text-xs text-ink-soft">
                      Sesión iniciada y tu elección de cookies. Sin ellas la web no funciona.
                    </span>
                  </span>
                  <span className="shrink-0 text-xs font-medium text-ink-soft">Siempre activas</span>
                </li>
                <li>
                  <label className="flex cursor-pointer items-start justify-between gap-4">
                    <span>
                      <span className="font-medium text-ink">Analíticas</span>
                      <span className="block text-xs text-ink-soft">
                        {CLARITY_ID
                          ? "Google Analytics y Microsoft Clarity: cuántas visitas hay, qué páginas se usan y cómo se navega por ellas (sin lo que escribes)."
                          : "Google Analytics: cuántas visitas hay y qué páginas se usan."}
                      </span>
                    </span>
                    <input
                      type="checkbox"
                      checked={borradorAnalitica}
                      onChange={(e) => setBorradorAnalitica(e.target.checked)}
                      className="mt-1 h-4 w-4 shrink-0 accent-teal-dark"
                    />
                  </label>
                </li>
                {PUBLICIDAD_ACTIVA && (
                  <li>
                    <label className="flex cursor-pointer items-start justify-between gap-4">
                      <span>
                        <span className="font-medium text-ink">Publicidad</span>
                        <span className="block text-xs text-ink-soft">
                          Medir si nuestros anuncios en Google, Facebook o Instagram funcionan.
                        </span>
                      </span>
                      <input
                        type="checkbox"
                        checked={borradorPublicidad}
                        onChange={(e) => setBorradorPublicidad(e.target.checked)}
                        className="mt-1 h-4 w-4 shrink-0 accent-teal-dark"
                      />
                    </label>
                  </li>
                )}
              </ul>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                <Link href="/legal/cookies" className="text-xs font-medium text-cyan-dark hover:underline">
                  Ver todas las cookies
                </Link>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => guardar(false, false)}
                    className="press rounded-lg border border-line px-4 py-2 text-sm font-medium text-ink hover:border-ink/40"
                  >
                    Rechazar todas
                  </button>
                  <button
                    type="button"
                    onClick={() => guardar(borradorAnalitica, borradorPublicidad)}
                    className="press rounded-lg bg-teal-dark px-4 py-2 text-sm font-medium text-white hover:bg-teal"
                  >
                    Guardar
                  </button>
                </div>
              </div>
            </div>
          )}
          </div>
        </div>
      )}
    </>
  );
}
