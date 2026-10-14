// Reglas deterministas para traducir lo que se extrae de webs y de
// Google al formato exacto de Growwly. Deliberadamente SIN IA: así el
// resultado es predecible y nunca se "inventa" una técnica que la
// clínica no nombra — lo que no encaja se enseña aparte al admin.

import { TECNICAS_DISPONIBLES, IDIOMAS_DISPONIBLES, PROVINCIAS_ESPANA } from "@/lib/clinic-options";
import type { DiaHorario, FotoCandidata } from "./tipos";

export function sinAcentos(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

// ---------------------------------------------------------------------
// Técnicas
// ---------------------------------------------------------------------

type ReglaTecnica = { tecnica: (typeof TECNICAS_DISPONIBLES)[number]; patron: RegExp };

// El orden no importa: un mismo texto puede activar varias técnicas
// ("Injerto FUE y DHI" → FUE + DHI).
const REGLAS_TECNICAS: ReglaTecnica[] = [
  { tecnica: "Injerto FUE", patron: /\bfue\b|\bfue[- ]?(zafiro|sapphire)|\bmicro[- ]?fue\b/ },
  { tecnica: "Injerto DHI", patron: /\bdhi\b|implanter|\bchoi\b/ },
  { tecnica: "Injerto FUT", patron: /\bfut\b|\bfuss\b|tecnica de tira|\bstrip\b/ },
  {
    tecnica: "Injerto sin afeitado",
    patron: /sin (afeitar|afeitado|rapar|rasurar|rasurado)|unshaven|non[- ]?shaven|long[- ]?hair/,
  },
  { tecnica: "Injerto de barba", patron: /barba|beard/ },
  { tecnica: "Injerto de cejas", patron: /ceja|eyebrow/ },
  { tecnica: "Mesoterapia capilar", patron: /mesoterapia|mesotherapy/ },
  { tecnica: "Carboxiterapia capilar", patron: /carboxiterapia|carboxiterapy|carboxitherapy/ },
  { tecnica: "PRP", patron: /\bprp\b|plasma|plaquetas|platelet/ },
  {
    tecnica: "Láser de baja intensidad",
    patron: /laser|\bled\b|fotobiomodula|lllt/,
  },
  { tecnica: "Minoxidil", patron: /minoxidil/ },
  { tecnica: "Finasteride / Dutasteride", patron: /finasteri|dutasteri/ },
  { tecnica: "Micropigmentación capilar", patron: /micropigment|\bsmp\b|tricopigment/ },
  { tecnica: "Extensiones de cabello", patron: /extension/ },
  {
    tecnica: "Pelucas y prótesis capilares",
    patron: /peluca|protesis|integracion capilar|sistemas? de integracion|hair system/,
  },
  { tecnica: "Consulta tricológica", patron: /tricolog|consulta capilar|diagnostico capilar/ },
  {
    tecnica: "Analítica capilar",
    patron: /tricoscop|analisis capilar|analitica|trichotest|estudio capilar|microscop/,
  },
];

/**
 * Traduce los tratamientos tal como los nombra la web a las técnicas
 * del catálogo. Un texto que no activa ninguna regla (p. ej. "trasplante
 * capilar" sin decir la técnica) va a `sinClasificar` en vez de
 * suponerse — que el admin decida.
 */
export function normalizarTecnicas(textos: string[]): {
  tecnicas: string[];
  sinClasificar: string[];
} {
  const tecnicas = new Set<string>();
  const sinClasificar: string[] = [];

  for (const original of textos) {
    const t = sinAcentos(original);
    if (!t) continue;
    let alguna = false;
    for (const regla of REGLAS_TECNICAS) {
      if (regla.patron.test(t)) {
        tecnicas.add(regla.tecnica);
        alguna = true;
      }
    }
    if (!alguna) sinClasificar.push(original.trim());
  }

  // Mantiene el orden del catálogo para que se vea igual que en el formulario.
  return {
    tecnicas: TECNICAS_DISPONIBLES.filter((t) => tecnicas.has(t)),
    sinClasificar: Array.from(new Set(sinClasificar)),
  };
}

// ---------------------------------------------------------------------
// Idiomas
// ---------------------------------------------------------------------

const REGLAS_IDIOMAS: { idioma: (typeof IDIOMAS_DISPONIBLES)[number]; patron: RegExp }[] = [
  { idioma: "Español", patron: /espanol|castellano|spanish/ },
  { idioma: "Inglés", patron: /ingles|english/ },
  { idioma: "Francés", patron: /frances|french|francais/ },
  { idioma: "Alemán", patron: /aleman|german|deutsch/ },
  { idioma: "Italiano", patron: /italian/ },
  { idioma: "Árabe", patron: /arabe|arabic/ },
  { idioma: "Euskera", patron: /euskera|basque/ },
];

export function normalizarIdiomas(textos: string[]): string[] {
  const idiomas = new Set<string>();
  for (const original of textos) {
    const t = sinAcentos(original);
    for (const regla of REGLAS_IDIOMAS) {
      if (regla.patron.test(t)) idiomas.add(regla.idioma);
    }
  }
  return IDIOMAS_DISPONIBLES.filter((i) => idiomas.has(i));
}

// ---------------------------------------------------------------------
// Horarios (Google Places → formato de HorarioSemanal)
// ---------------------------------------------------------------------

export type PeriodoGoogle = {
  open?: { day?: number; hour?: number; minute?: number };
  close?: { day?: number; hour?: number; minute?: number };
};

// Google numera los días 0 = domingo … 6 = sábado.
const DIAS_GOOGLE = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const DIAS_ORDEN = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

function hhmm(hora = 0, minuto = 0): string {
  return `${String(hora).padStart(2, "0")}:${String(minuto).padStart(2, "0")}`;
}

/**
 * El formulario solo admite un tramo por día, así que una jornada
 * partida (10-14 y 16-20) se guarda como 10:00-20:00. Por eso el texto
 * completo de Google se guarda además en `horarios`, que sí la conserva.
 * Sin periodos → lista vacía (se deja el horario sin tocar).
 */
export function horariosDesdeGoogle(periodos: PeriodoGoogle[] | undefined): DiaHorario[] {
  if (!periodos || periodos.length === 0) return [];

  // Abierto 24h: un único periodo que abre el domingo a las 00:00 y no cierra.
  if (periodos.length === 1 && !periodos[0].close) {
    return DIAS_ORDEN.map((dia) => ({ dia, abierto: true, desde: "00:00", hasta: "23:59" }));
  }

  const porDia = new Map<string, { desde: string; hasta: string }>();
  for (const p of periodos) {
    if (p.open?.day === undefined) continue;
    const dia = DIAS_GOOGLE[p.open.day];
    const desde = hhmm(p.open.hour, p.open.minute);
    // Si cierra al día siguiente (pasada la medianoche), lo dejamos en 23:59.
    const hasta =
      p.close && p.close.day === p.open.day ? hhmm(p.close.hour, p.close.minute) : "23:59";
    const previo = porDia.get(dia);
    porDia.set(dia, {
      desde: previo && previo.desde < desde ? previo.desde : desde,
      hasta: previo && previo.hasta > hasta ? previo.hasta : hasta,
    });
  }

  return DIAS_ORDEN.map((dia) => {
    const tramo = porDia.get(dia);
    return tramo
      ? { dia, abierto: true, desde: tramo.desde, hasta: tramo.hasta }
      : { dia, abierto: false, desde: "09:00", hasta: "20:00" };
  });
}

// ---------------------------------------------------------------------
// Municipio y provincia
// ---------------------------------------------------------------------

/** Empareja el nombre que da Google con la lista oficial de municipios (sin depender de acentos). */
export function emparejarMunicipio(candidatos: string[], municipios: string[]): string | null {
  const indice = new Map(municipios.map((m) => [sinAcentos(m), m]));
  for (const c of candidatos) {
    const limpio = sinAcentos(c)
      .replace(/^palma de mallorca$/, "palma")
      .replace(/^ciutat de mallorca$/, "palma");
    const exacto = indice.get(limpio);
    if (exacto) return exacto;
  }
  return null;
}

const ALIAS_PROVINCIA: Record<string, string> = {
  "islas baleares": "Illes Balears",
  "balearic islands": "Illes Balears",
  baleares: "Illes Balears",
  "illes balears": "Illes Balears",
};

export function emparejarProvincia(candidatos: string[]): string | null {
  for (const c of candidatos) {
    const limpio = sinAcentos(c);
    if (ALIAS_PROVINCIA[limpio]) return ALIAS_PROVINCIA[limpio];
    const p = PROVINCIAS_ESPANA.find((prov) => sinAcentos(prov) === limpio);
    if (p) return p;
  }
  return null;
}

// ---------------------------------------------------------------------
// Fotos
// ---------------------------------------------------------------------

const PATRON_STOCK =
  /adobestock|adobe-stock|shutterstock|istock|depositphotos|dreamstime|freepik|gettyimages|pexels|unsplash|123rf|stock[-_]?photo/;

// Iconos, banderas, trackers y similares: nunca son fotos útiles.
const PATRON_DESCARTE =
  /favicon|sprite|icon|icono|flag|bandera|whatsapp|placeholder|loader|loading|arrow|flecha|pixel|tracking|spinner|avatar|gravatar|emoji|badge|sello|payment|visa|mastercard|paypal|google|facebook|instagram|tiktok|linkedin|youtube|twitter|cookie/;

// Mapas incrustados, CDNs de widgets y emojis: nunca son fotos de la clínica.
const HOSTS_DESCARTE =
  /openstreetmap|tile\.|maps\.googleapis|maps\.gstatic|mapbox|googleusercontent|gstatic|doubleclick|facebook\.com|fbcdn|s\.w\.org|gravatar|trustindex|elfsight|google-analytics/i;

const EXTENSIONES_VALIDAS = /\.(jpe?g|png|webp|avif)$/;

function anchoDeLaUrl(url: URL): number {
  for (const clave of ["w", "width", "wid", "size"]) {
    const v = Number(url.searchParams.get(clave));
    if (Number.isFinite(v) && v > 0) return v;
  }
  const enRuta = url.pathname.match(/-(\d{2,4})x\d{2,4}\.\w+$/);
  return enRuta ? Number(enRuta[1]) : 0;
}

/** Clave para detectar la misma foto servida en varios tamaños o formatos. */
function claveFoto(url: URL): string {
  const archivo = url.pathname.split("/").pop() ?? url.pathname;
  return sinAcentos(archivo)
    .replace(/\.\w+$/, "")
    .replace(/-\d{2,4}x\d{2,4}$/, "")
    .replace(/(@\dx|-scaled|-e\d{10,})$/, "");
}

/**
 * Quita duplicados (misma foto en jpg/webp y en varios tamaños, nos
 * quedamos con la más grande), descarta iconos/logos/trackers y marca
 * las de banco de imágenes. Devuelve como mucho `max` candidatas, con
 * las reales primero.
 */
export function filtrarFotos(urls: string[], excluir: string[], max = 30): FotoCandidata[] {
  const excluidas = new Set(
    excluir
      .map((u) => {
        try {
          return claveFoto(new URL(u));
        } catch {
          return null;
        }
      })
      .filter(Boolean),
  );

  const mejores = new Map<string, { url: string; ancho: number; stock: boolean }>();

  for (const bruta of urls) {
    let url: URL;
    try {
      url = new URL(bruta);
    } catch {
      continue;
    }
    if (url.protocol !== "https:" && url.protocol !== "http:") continue;
    if (HOSTS_DESCARTE.test(url.hostname)) continue;
    // Teselas de mapa (/{z}/{x}/{y}.png) de cualquier proveedor.
    if (/\/\d{1,2}\/\d+\/\d+\.(png|jpe?g|webp)$/.test(url.pathname)) continue;

    const ruta = sinAcentos(decodeURIComponent(url.pathname));
    if (!EXTENSIONES_VALIDAS.test(ruta)) continue;
    if (PATRON_DESCARTE.test(ruta) || /logo/.test(ruta)) continue;

    const clave = claveFoto(url);
    if (!clave || excluidas.has(clave)) continue;

    const ancho = anchoDeLaUrl(url);
    const previa = mejores.get(clave);
    if (!previa || ancho > previa.ancho) {
      mejores.set(clave, { url: url.toString(), ancho, stock: PATRON_STOCK.test(ruta) });
    }
  }

  const lista = Array.from(mejores.values());
  return [...lista.filter((f) => !f.stock), ...lista.filter((f) => f.stock)]
    .slice(0, max)
    .map(({ url, stock }) => ({ url, stock }));
}

// ---------------------------------------------------------------------
// Redes sociales
// ---------------------------------------------------------------------

/** Se queda solo con URLs que de verdad son de esa red (evita enlaces de "compartir"). */
export function limpiarRed(red: "instagram" | "facebook" | "tiktok" | "linkedin", valor: string | null | undefined): string | null {
  if (!valor) return null;
  const v = valor.trim();
  const dominios: Record<typeof red, RegExp> = {
    instagram: /instagram\.com\/(?!p\/|reel\/|share)[\w.]+/i,
    facebook: /facebook\.com\/(?!sharer|share|dialog)[\w.\-]+/i,
    tiktok: /tiktok\.com\/@[\w.]+/i,
    linkedin: /linkedin\.com\/(company|in)\/[\w\-]+/i,
  };
  return dominios[red].test(v) ? v : null;
}
