// Extracción de datos, logo y fotos de la web de una clínica con la
// API de Firecrawl (https://docs.firecrawl.dev). Lee la home y, si ahí
// apenas se nombran tratamientos, también su página de "Tratamientos"
// o "Servicios". Coste: ~5 créditos por página leída.

import { filtrarFotos, limpiarRed, normalizarIdiomas, normalizarTecnicas } from "./normalizar";
import type { DatosWeb } from "./tipos";

const ESQUEMA = {
  type: "object",
  properties: {
    nombre_clinica: { type: ["string", "null"] },
    descripcion: { type: ["string", "null"] },
    telefono: { type: ["string", "null"] },
    email: { type: ["string", "null"] },
    direccion: { type: ["string", "null"] },
    tratamientos_capilares: { type: "array", items: { type: "string" } },
    idiomas_atencion: { type: "array", items: { type: "string" } },
    ofrece_financiacion: { type: ["boolean", "null"] },
    primera_consulta_gratis: { type: ["boolean", "null"] },
    oferta_actual: { type: ["string", "null"] },
    precios: { type: ["string", "null"] },
    instagram: { type: ["string", "null"] },
    facebook: { type: ["string", "null"] },
    tiktok: { type: ["string", "null"] },
    linkedin: { type: ["string", "null"] },
  },
  required: ["tratamientos_capilares", "idiomas_atencion"],
};

const PROMPT = `Extrae los datos de esta clínica (capilar, dermatológica o de medicina estética).
Regla principal: NO inventes nada. Si un dato no aparece de forma explícita en la página, devuelve null (o una lista vacía).
- descripcion: 2-3 frases en español, tono neutro e informativo, explicando qué tipo de centro es y qué hace en el ámbito capilar. Sin superlativos ni frases publicitarias ("los mejores", "líderes", "tu mejor versión"...).
- tratamientos_capilares: solo tratamientos del cabello, cuero cabelludo, barba o cejas, con el nombre que usa la web. Ignora tratamientos faciales, corporales, dentales, etc.
- idiomas_atencion: solo si la web dice en qué idiomas atiende.
- ofrece_financiacion / primera_consulta_gratis: true solo si se dice claramente; null si no se menciona.
- oferta_actual: una promoción concreta vigente que se mencione (precio especial, regalo...), si la hay.
- precios: precios concretos que aparezcan para tratamientos capilares, tal cual (p. ej. "Injerto FUE desde 2.900€").
- redes: URL completa del perfil de la clínica en cada red, solo si hay enlace.`;

type RespuestaFirecrawl = {
  success?: boolean;
  error?: string;
  data?: {
    json?: Record<string, unknown>;
    images?: string[];
    links?: string[];
    branding?: {
      logo?: string | null;
      images?: { logo?: string | null; ogImage?: string | null; favicon?: string | null };
    };
    metadata?: {
      title?: string;
      ogTitle?: string;
      ogImage?: string;
      url?: string;
      sourceURL?: string;
      statusCode?: number;
    };
  };
};

function texto(v: unknown): string | null {
  return typeof v === "string" && v.trim() !== "" ? v.trim() : null;
}

function lista(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string" && x.trim() !== "") : [];
}

function booleano(v: unknown): boolean | null {
  return typeof v === "boolean" ? v : null;
}

export function normalizarUrlWeb(entrada: string): string | null {
  const limpia = entrada.trim().split(/\s+/)[0];
  if (!limpia) return null;
  try {
    const url = new URL(/^https?:\/\//i.test(limpia) ? limpia : `https://${limpia}`);
    if (!url.hostname.includes(".")) return null;
    return url.toString();
  } catch {
    return null;
  }
}

type DatosPagina = NonNullable<RespuestaFirecrawl["data"]>;

async function leerPagina(
  url: string,
  apiKey: string,
  conMarca: boolean,
  timeoutMs: number,
): Promise<DatosPagina> {
  const res = await fetch("https://api.firecrawl.dev/v2/scrape", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      url,
      formats: [
        "images",
        ...(conMarca ? ["branding", "links"] : []),
        { type: "json", schema: ESQUEMA, prompt: PROMPT },
      ],
      // Sin esto Firecrawl quita cabecera y pie, que es justo donde
      // suelen estar el logo, el teléfono y las redes.
      onlyMainContent: false,
      timeout: timeoutMs - 3000,
      location: { country: "ES", languages: ["es"] },
    }),
    signal: AbortSignal.timeout(timeoutMs),
  });

  const cuerpo = (await res.json().catch(() => ({}))) as RespuestaFirecrawl;
  if (!res.ok || !cuerpo.success || !cuerpo.data) {
    throw new Error(
      `Firecrawl no pudo leer la web (${res.status}${cuerpo.error ? `: ${cuerpo.error}` : ""}).`,
    );
  }
  return cuerpo.data;
}

const PATRON_SUBPAGINA = /tratamient|servicio|injerto|trasplante|capilar|alopecia|precio|tarifa/;

/**
 * Muchas webs solo nombran 1-2 tratamientos en la home y el resto en
 * una página "Tratamientos" o "Servicios". Elige esa subpágina (mismo
 * dominio) para una segunda lectura.
 */
function elegirSubpagina(links: string[], base: string): string | null {
  const host = new URL(base).hostname.replace(/^www\./, "");
  const candidatas = links
    .map((l) => {
      try {
        return new URL(l, base);
      } catch {
        return null;
      }
    })
    .filter(
      (u): u is URL =>
        u !== null &&
        u.hostname.replace(/^www\./, "") === host &&
        u.pathname.length > 1 &&
        PATRON_SUBPAGINA.test(decodeURIComponent(u.pathname).toLowerCase()),
    )
    .map((u) => {
      const ruta = decodeURIComponent(u.pathname).toLowerCase();
      // Mejor una página índice ("/tratamientos/") que una concreta ("/tratamientos/prp").
      const puntos =
        (/tratamientos|servicios/.test(ruta) ? 10 : 0) - ruta.split("/").filter(Boolean).length;
      return { url: `${u.origin}${u.pathname}`, puntos };
    })
    .sort((a, b) => b.puntos - a.puntos);
  return candidatas[0]?.url ?? null;
}

export async function extraerDatosWeb(urlEntrada: string): Promise<DatosWeb> {
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) throw new Error("Falta FIRECRAWL_API_KEY en las variables de entorno de Vercel.");

  const url = normalizarUrlWeb(urlEntrada);
  if (!url) throw new Error("La web no tiene un formato válido.");

  const inicio = Date.now();
  const home = await leerPagina(url, apiKey, true, 35000);
  const json = home.json ?? {};
  const urlFinal = home.metadata?.url ?? home.metadata?.sourceURL ?? url;

  // Segunda lectura solo si la home se queda corta de tratamientos y
  // queda tiempo (la página del importador tiene un límite de 60s).
  let extra: DatosPagina | null = null;
  const subpagina =
    lista(json.tratamientos_capilares).length < 3 ? elegirSubpagina(home.links ?? [], urlFinal) : null;
  const restante = 45000 - (Date.now() - inicio);
  if (subpagina && restante > 15000) {
    try {
      extra = await leerPagina(subpagina, apiKey, false, restante);
    } catch {
      // No es crítica: seguimos con lo de la home.
    }
  }
  const jsonExtra = extra?.json ?? {};

  const { tecnicas, sinClasificar } = normalizarTecnicas([
    ...lista(json.tratamientos_capilares),
    ...lista(jsonExtra.tratamientos_capilares),
  ]);

  const { branding, metadata } = home;
  const logos = Array.from(
    new Set([branding?.logo, branding?.images?.logo].filter((l): l is string => Boolean(l))),
  );

  const fotosBrutas = [
    ...(branding?.images?.ogImage ? [branding.images.ogImage] : []),
    ...(metadata?.ogImage ? [metadata.ogImage] : []),
    ...(home.images ?? []),
    ...(extra?.images ?? []),
  ];

  // De la subpágina solo se usan los campos que la home no tenía.
  const de = (clave: string) => texto(json[clave]) ?? texto(jsonExtra[clave]);
  const deBool = (clave: string) => booleano(json[clave]) ?? booleano(jsonExtra[clave]);

  return {
    urlFinal,
    titulo: texto(json.nombre_clinica) ?? texto(metadata?.ogTitle) ?? texto(metadata?.title),
    descripcion: texto(json.descripcion),
    telefono: de("telefono"),
    email: de("email"),
    direccion: de("direccion"),
    tecnicas,
    tratamientosSinClasificar: sinClasificar,
    idiomas: normalizarIdiomas([
      ...lista(json.idiomas_atencion),
      ...lista(jsonExtra.idiomas_atencion),
    ]),
    financiacion: deBool("ofrece_financiacion"),
    primeraConsultaGratis: deBool("primera_consulta_gratis"),
    oferta: de("oferta_actual"),
    precios: de("precios"),
    redes: {
      instagram: limpiarRed("instagram", de("instagram")),
      facebook: limpiarRed("facebook", de("facebook")),
      tiktok: limpiarRed("tiktok", de("tiktok")),
      linkedin: limpiarRed("linkedin", de("linkedin")),
    },
    logos,
    fotos: filtrarFotos(fotosBrutas, logos),
  };
}
