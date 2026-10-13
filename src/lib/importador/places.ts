// Búsqueda de la clínica en Google Maps (Places API New) para el
// importador. A diferencia de buscarCandidatosPlace (lib/google-places),
// pide también dirección desglosada, teléfono, horario y accesibilidad
// para rellenar la ficha de una vez. El resultado se enseña como
// candidatos: el admin siempre confirma cuál es la clínica correcta.

import {
  emparejarMunicipio,
  emparejarProvincia,
  horariosDesdeGoogle,
  type PeriodoGoogle,
} from "./normalizar";
import type { CandidatoGoogle } from "./tipos";

const CAMPOS = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.addressComponents",
  "places.location",
  "places.rating",
  "places.userRatingCount",
  "places.nationalPhoneNumber",
  "places.websiteUri",
  "places.googleMapsUri",
  "places.regularOpeningHours",
  "places.accessibilityOptions",
].join(",");

type PlaceGoogle = {
  id: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  addressComponents?: { longText?: string; shortText?: string; types?: string[] }[];
  location?: { latitude?: number; longitude?: number };
  rating?: number;
  userRatingCount?: number;
  nationalPhoneNumber?: string;
  websiteUri?: string;
  googleMapsUri?: string;
  regularOpeningHours?: { periods?: PeriodoGoogle[]; weekdayDescriptions?: string[] };
  accessibilityOptions?: {
    wheelchairAccessibleEntrance?: boolean;
    wheelchairAccessibleRestroom?: boolean;
  };
};

function componentes(p: PlaceGoogle, tipo: string): string[] {
  return (p.addressComponents ?? [])
    .filter((c) => c.types?.includes(tipo))
    .flatMap((c) => [c.longText, c.shortText])
    .filter((t): t is string => Boolean(t));
}

function mapearPlace(p: PlaceGoogle, municipios: string[]): CandidatoGoogle {
  const accesibilidad: string[] = [];
  if (p.accessibilityOptions?.wheelchairAccessibleEntrance) accesibilidad.push("entrada_sin_escalones");
  if (p.accessibilityOptions?.wheelchairAccessibleRestroom) accesibilidad.push("aseos_adaptados");

  return {
    placeId: p.id,
    nombre: p.displayName?.text ?? "",
    direccion: p.formattedAddress ?? "",
    telefono: p.nationalPhoneNumber?.replace(/\s+/g, "") ?? null,
    web: p.websiteUri ?? null,
    lat: p.location?.latitude ?? null,
    lng: p.location?.longitude ?? null,
    rating: p.rating ?? null,
    totalResenas: p.userRatingCount ?? null,
    mapsUri: p.googleMapsUri ?? null,
    ciudad: emparejarMunicipio(
      [
        ...componentes(p, "locality"),
        ...componentes(p, "administrative_area_level_3"),
        ...componentes(p, "postal_town"),
      ],
      municipios,
    ),
    provincia: emparejarProvincia([
      ...componentes(p, "administrative_area_level_2"),
      ...componentes(p, "administrative_area_level_1"),
    ]),
    horariosEstructurados: horariosDesdeGoogle(p.regularOpeningHours?.periods),
    horariosTexto: p.regularOpeningHours?.weekdayDescriptions?.join("; ") ?? null,
    accesibilidadChecks: accesibilidad,
  };
}

function apiKey(): string {
  const key = process.env.GOOGLE_PLACES_API_KEY?.trim();
  if (!key) throw new Error("Falta GOOGLE_PLACES_API_KEY en las variables de entorno.");
  // Nunca dejar que la clave acabe en un mensaje de error visible: si
  // tiene espacios (pegada dos veces, salto de línea...) se avisa sin mostrarla.
  if (/\s/.test(key)) {
    throw new Error(
      "GOOGLE_PLACES_API_KEY en Vercel tiene espacios o saltos de línea (¿pegada dos veces?). Corrígela y vuelve a desplegar.",
    );
  }
  return key;
}

async function textSearch(
  cuerpo: Record<string, unknown>,
  municipios: string[],
): Promise<CandidatoGoogle[]> {
  const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey(),
      "X-Goog-FieldMask": CAMPOS,
    },
    body: JSON.stringify({ languageCode: "es", regionCode: "ES", ...cuerpo }),
    signal: AbortSignal.timeout(12000),
  });

  if (!res.ok) {
    throw new Error(`Google Places respondió ${res.status}: ${(await res.text()).slice(0, 200)}`);
  }

  const data: { places?: PlaceGoogle[] } = await res.json();
  return (data.places ?? []).map((p) => mapearPlace(p, municipios));
}

export async function buscarEnGoogle(
  consulta: string,
  municipios: string[],
): Promise<CandidatoGoogle[]> {
  return textSearch({ textQuery: consulta, pageSize: 5 }, municipios);
}

async function obtenerPorId(placeId: string, municipios: string[]): Promise<CandidatoGoogle> {
  const res = await fetch(
    `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}?languageCode=es`,
    {
      headers: {
        "X-Goog-Api-Key": apiKey(),
        // Place Details usa los mismos campos pero sin el prefijo "places.".
        "X-Goog-FieldMask": CAMPOS.replaceAll("places.", ""),
      },
      signal: AbortSignal.timeout(12000),
    },
  );
  if (!res.ok) {
    throw new Error(`Google Places respondió ${res.status}: ${(await res.text()).slice(0, 200)}`);
  }
  return mapearPlace((await res.json()) as PlaceGoogle, municipios);
}

// ---------------------------------------------------------------------
// Enlace de Google Maps pegado a mano
// ---------------------------------------------------------------------

// Solo se siguen redirecciones dentro de Google: la URL llega del navegador.
const HOSTS_GOOGLE = /^(maps\.app\.goo\.gl|goo\.gl|(www\.|maps\.|consent\.)?google\.[a-z]{2,3}(\.[a-z]{2})?)$/i;

/** Los enlaces de "Compartir" (maps.app.goo.gl/…) redirigen a la URL larga con nombre y coordenadas. */
async function expandirEnlace(entrada: string): Promise<URL> {
  let url = new URL(/^https?:\/\//i.test(entrada.trim()) ? entrada.trim() : `https://${entrada.trim()}`);
  for (let salto = 0; salto < 4; salto++) {
    if (!HOSTS_GOOGLE.test(url.hostname)) {
      throw new Error("El enlace no es de Google Maps.");
    }
    // Pantalla de cookies de Google en la UE: el destino real va en ?continue=
    if (url.hostname.startsWith("consent.")) {
      const destino = url.searchParams.get("continue");
      if (!destino) break;
      url = new URL(destino);
      continue;
    }
    if (!/goo\.gl$/i.test(url.hostname)) break;
    const res = await fetch(url, { redirect: "manual", signal: AbortSignal.timeout(8000) });
    const location = res.headers.get("location");
    if (!location) break;
    url = new URL(location, url);
  }
  return url;
}

function distanciaMetros(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const rad = Math.PI / 180;
  const dLat = (lat2 - lat1) * rad;
  const dLng = (lng2 - lng1) * rad;
  const a =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLng / 2) ** 2;
  return 6371000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Convierte un enlace de Google Maps en su ficha. Si el enlace trae el
 * place_id se usa directamente; si no (lo normal), se sacan el nombre y
 * las coordenadas exactas del enlace y se busca esa ficha pegada a ese
 * punto, quedándonos con la más cercana (máx. 250 m).
 */
export async function fichaDesdeEnlaceMaps(
  enlace: string,
  municipios: string[],
): Promise<CandidatoGoogle> {
  const url = await expandirEnlace(enlace);
  const completa = decodeURIComponent(url.toString());

  const placeId =
    url.searchParams.get("query_place_id") ??
    completa.match(/place_id[:=](ChIJ[\w-]+)/)?.[1] ??
    null;
  if (placeId) return obtenerPorId(placeId, municipios);

  const nombre = url.pathname.match(/\/maps\/place\/([^/]+)/)?.[1]?.replace(/\+/g, " ").trim();
  // !3d!4d = coordenadas del propio sitio; @lat,lng = centro del mapa (menos preciso).
  const exactas = completa.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
  const centro = completa.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  const coords = exactas ?? centro;

  if (!nombre) {
    throw new Error(
      "No se reconoce el enlace. Abre la ficha de la clínica en Google Maps y usa Compartir → Copiar enlace.",
    );
  }

  const lat = coords ? Number(coords[1]) : null;
  const lng = coords ? Number(coords[2]) : null;

  const candidatos = await textSearch(
    {
      textQuery: decodeURIComponent(nombre),
      pageSize: 5,
      ...(lat !== null && lng !== null
        ? { locationBias: { circle: { center: { latitude: lat, longitude: lng }, radius: 300 } } }
        : {}),
    },
    municipios,
  );

  if (lat === null || lng === null) {
    if (!candidatos[0]) throw new Error("No se encontró esa ficha en Google Maps.");
    return candidatos[0];
  }

  const masCercano = candidatos
    .filter((c) => c.lat !== null && c.lng !== null)
    .map((c) => ({ c, d: distanciaMetros(lat, lng, c.lat!, c.lng!) }))
    .sort((a, b) => a.d - b.d)[0];

  if (!masCercano || masCercano.d > 250) {
    throw new Error("No se encontró esa ficha en Google Maps a partir del enlace.");
  }
  return masCercano.c;
}
