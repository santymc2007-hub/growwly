// Búsqueda masiva de centros en Google Maps con Apify
// (actor compass/crawler-google-places). Lo usa
// /admin/clinicas/importar-provincia.

const ACTOR = "compass~crawler-google-places";
const API = "https://api.apify.com/v2";

/** Búsquedas que cubren todo lo capilar (ver skill growwly-scrapear-provincia). */
export const BUSQUEDAS_CAPILARES = [
  "injerto capilar",
  "clínica capilar",
  "tricólogo",
  "tricología",
  "dermatólogo alopecia",
  "dermatólogo capilar",
  "mesoterapia capilar",
  "PRP capilar",
  "micropigmentación capilar",
  "caída del cabello tratamiento",
] as const;

function token(): string {
  const t = process.env.APIFY_TOKEN?.trim();
  if (!t) throw new Error("Falta APIFY_TOKEN en las variables de entorno de Vercel.");
  if (/\s/.test(t)) {
    throw new Error("APIFY_TOKEN en Vercel tiene espacios o saltos de línea. Corrígelo y vuelve a desplegar.");
  }
  return t;
}

async function apify<T>(ruta: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${ruta}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token()}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });
  if (!res.ok) {
    let detalle = "";
    try {
      const j = (await res.json()) as { error?: { message?: string } };
      detalle = j.error?.message ?? "";
    } catch {
      /* sin cuerpo */
    }
    throw new Error(`Apify respondió ${res.status}${detalle ? `: ${detalle}` : ""}`);
  }
  return (await res.json()) as T;
}

type RunApify = { id: string; status: string; defaultDatasetId: string; statusMessage?: string | null };

// Provincias que en OpenStreetMap son a la vez comunidad autónoma: se
// buscan como "state"; el resto como "county" (provincia). Con texto libre
// ("Provincia de Asturias") Apify geolocalizaba un pueblo y buscaba solo
// en 60 km².
const UNIPROVINCIALES = new Set([
  "Asturias",
  "Cantabria",
  "Madrid",
  "Murcia",
  "Navarra",
  "La Rioja",
  "Illes Balears",
]);

export type ZonaBusqueda = { provincia: string } | { texto: string };

export function describirZona(zona: ZonaBusqueda): string {
  return "texto" in zona ? zona.texto : `Provincia completa: ${zona.provincia}`;
}

/**
 * Lanza la búsqueda (asíncrona: no espera a que termine).
 * `maxGastoUsd` corta la ejecución si se pasa de ese coste.
 */
export async function lanzarBusqueda(
  zona: ZonaBusqueda,
  maxPorBusqueda: number,
  maxGastoUsd: number,
): Promise<RunApify> {
  const ubicacion =
    "texto" in zona
      ? { locationQuery: zona.texto }
      : UNIPROVINCIALES.has(zona.provincia)
        ? { state: zona.provincia }
        : { county: zona.provincia };
  const input = {
    searchStringsArray: BUSQUEDAS_CAPILARES,
    ...ubicacion,
    language: "es",
    countryCode: "es",
    maxCrawledPlacesPerSearch: maxPorBusqueda,
    skipClosedPlaces: true,
    scrapePlaceDetailPage: true,
    scrapeContacts: true,
    maxReviews: 0,
    maxImages: 0,
  };
  const { data } = await apify<{ data: RunApify }>(
    `/acts/${ACTOR}/runs?maxTotalChargeUsd=${encodeURIComponent(String(maxGastoUsd))}`,
    { method: "POST", body: JSON.stringify(input) },
  );
  return data;
}

export async function estadoRun(runId: string): Promise<RunApify> {
  const { data } = await apify<{ data: RunApify }>(`/actor-runs/${encodeURIComponent(runId)}`);
  return data;
}

/** Nº de resultados que lleva el dataset (para mostrar el progreso). */
export async function totalDataset(datasetId: string): Promise<number> {
  const { data } = await apify<{ data: { itemCount?: number } }>(`/datasets/${encodeURIComponent(datasetId)}`);
  return data.itemCount ?? 0;
}

/** Un resultado del actor (solo los campos que usamos). */
export type LugarApify = {
  placeId?: string;
  title?: string;
  categoryName?: string | null;
  categories?: string[] | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  countryCode?: string | null;
  location?: { lat?: number; lng?: number } | null;
  phone?: string | null;
  phoneUnformatted?: string | null;
  website?: string | null;
  totalScore?: number | null;
  reviewsCount?: number | null;
  url?: string | null;
  permanentlyClosed?: boolean | null;
  temporarilyClosed?: boolean | null;
  emails?: string[] | null;
  instagrams?: string[] | null;
  facebooks?: string[] | null;
  tiktoks?: string[] | null;
};

export async function resultadosDataset(datasetId: string): Promise<LugarApify[]> {
  const todos: LugarApify[] = [];
  const pagina = 1000;
  for (let offset = 0; offset < 20000; offset += pagina) {
    const lote = await apify<LugarApify[]>(
      `/datasets/${encodeURIComponent(datasetId)}/items?clean=true&format=json&offset=${offset}&limit=${pagina}`,
    );
    todos.push(...lote);
    if (lote.length < pagina) break;
  }
  return todos;
}
