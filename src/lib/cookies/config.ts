/**
 * Configuración de cookies de Growwly: qué categorías hay, qué
 * etiquetas carga cada una y qué cookies deja. La usan el banner
 * (components/analytics/cookie-consent.tsx) y la tabla de la política
 * (/legal/cookies), para que lo que se cuenta y lo que se hace no se
 * separen nunca.
 *
 * Publicidad: la categoría solo aparece en el banner y en la tabla
 * cuando hay algún píxel configurado. Para empezar con anuncios basta
 * con definir en Vercel NEXT_PUBLIC_GOOGLE_ADS_ID (AW-…) y/o
 * NEXT_PUBLIC_META_PIXEL_ID y redesplegar: el banner volverá a
 * preguntar a quien todavía no haya decidido sobre publicidad.
 */

export const GA_MEASUREMENT_ID = "G-20S7PBB85Z";
/**
 * Microsoft Clarity (grabaciones de sesión y mapas de calor), dentro de
 * las cookies analíticas (proyecto "Growwly" en clarity.microsoft.com;
 * NEXT_PUBLIC_CLARITY_ID lo sustituye si hiciera falta). Las zonas con datos de salud o personales van con
 * data-clarity-mask (ver MascaraClarity).
 */
export const CLARITY_ID = process.env.NEXT_PUBLIC_CLARITY_ID || "z036uebdv1";
export const GOOGLE_ADS_ID = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID ?? "";
export const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID ?? "";
/**
 * Etiqueta de la acción de conversión "Lead" de Google Ads (la parte de
 * send_to que va tras la barra: AW-…/ESTA_PARTE). Sin ella no se manda
 * conversión directa a Ads.
 */
export const GOOGLE_ADS_LEAD_LABEL = process.env.NEXT_PUBLIC_GOOGLE_ADS_LEAD_LABEL ?? "";
export const PUBLICIDAD_ACTIVA = Boolean(GOOGLE_ADS_ID || META_PIXEL_ID);

export type FilaCookie = {
  nombre: string;
  proveedor: string;
  finalidad: string;
  duracion: string;
  /** Dónde se tratan los datos, si sale de la UE/EEE. */
  transferencia?: string;
};

export const COOKIES_NECESARIAS: FilaCookie[] = [
  {
    nombre: "sb-…-auth-token",
    proveedor: "Growwly (Supabase)",
    finalidad: "Mantener tu sesión iniciada como paciente, clínica o administrador.",
    duracion: "Hasta cerrar sesión (máx. 400 días)",
  },
  {
    nombre: "clinica_activa_id",
    proveedor: "Growwly",
    finalidad: "Recordar qué clínica estás gestionando si tu cuenta lleva varias.",
    duracion: "1 año",
  },
  {
    nombre: "growwly_consent_v2 (almacenamiento local)",
    proveedor: "Growwly",
    finalidad: "Guardar tu elección sobre cookies.",
    duracion: "24 meses",
  },
];

export const COOKIES_ANALITICAS: FilaCookie[] = [
  {
    nombre: "_ga",
    proveedor: "Google Analytics (Google)",
    finalidad: "Distinguir visitantes de forma anónima para contar visitas.",
    duracion: "2 años",
    transferencia: "EE. UU. (Marco de Privacidad de Datos UE-EE. UU.)",
  },
  {
    nombre: "_ga_*",
    proveedor: "Google Analytics (Google)",
    finalidad: "Mantener el estado de la sesión de analítica.",
    duracion: "2 años",
    transferencia: "EE. UU. (Marco de Privacidad de Datos UE-EE. UU.)",
  },
  ...(CLARITY_ID
    ? [
        {
          nombre: "_clck, _clsk",
          proveedor: "Microsoft Clarity (Microsoft)",
          finalidad:
            "Ver de forma anónima cómo se navega por la web (clics, desplazamiento) para mejorarla. No guarda lo que escribes.",
          duracion: "1 año (_clck) y 1 día (_clsk)",
          transferencia: "EE. UU. (Marco de Privacidad de Datos UE-EE. UU.)",
        },
        {
          nombre: "CLID, MUID, ANONCHK, SM, MR",
          proveedor: "Microsoft Clarity (Microsoft)",
          finalidad: "Identificar el navegador de forma anónima entre visitas para las estadísticas de Clarity.",
          duracion: "Hasta 1 año",
          transferencia: "EE. UU. (Marco de Privacidad de Datos UE-EE. UU.)",
        },
      ]
    : []),
];

export const COOKIES_PUBLICIDAD: FilaCookie[] = [
  ...(GOOGLE_ADS_ID
    ? [
        {
          nombre: "_gcl_au",
          proveedor: "Google Ads (Google)",
          finalidad: "Saber si una visita viene de un anuncio y medir sus resultados.",
          duracion: "90 días",
          transferencia: "EE. UU. (Marco de Privacidad de Datos UE-EE. UU.)",
        },
      ]
    : []),
  ...(META_PIXEL_ID
    ? [
        {
          nombre: "_fbp, _fbc",
          proveedor: "Meta (Facebook e Instagram)",
          finalidad: "Medir los resultados de los anuncios en Facebook e Instagram.",
          duracion: "90 días",
          transferencia: "EE. UU. (Marco de Privacidad de Datos UE-EE. UU.)",
        },
      ]
    : []),
  ...(PUBLICIDAD_ACTIVA
    ? [
        {
          nombre: "growwly_atribucion (almacenamiento local)",
          proveedor: "Growwly",
          finalidad:
            "Recordar desde qué anuncio o campaña llegaste, para saber qué anuncios traen solicitudes. No sale de Growwly.",
          duracion: "90 días",
        },
      ]
    : []),
];

/** Prefijos de las cookies que hay que borrar al retirar cada consentimiento. */
export const PREFIJOS_ANALITICA = ["_ga", "_gid", "_gat", "_clck", "_clsk"];
export const PREFIJOS_PUBLICIDAD = ["_gcl", "_fbp", "_fbc"];
