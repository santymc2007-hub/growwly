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

export async function buscarEnGoogle(
  consulta: string,
  municipios: string[],
): Promise<CandidatoGoogle[]> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) throw new Error("Falta GOOGLE_PLACES_API_KEY en las variables de entorno.");

  const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": CAMPOS,
    },
    body: JSON.stringify({
      textQuery: consulta,
      languageCode: "es",
      regionCode: "ES",
      pageSize: 5,
    }),
    signal: AbortSignal.timeout(12000),
  });

  if (!res.ok) {
    throw new Error(`Google Places respondió ${res.status}: ${(await res.text()).slice(0, 200)}`);
  }

  const data: { places?: PlaceGoogle[] } = await res.json();

  return (data.places ?? []).map((p) => {
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
        [...componentes(p, "locality"), ...componentes(p, "administrative_area_level_3"), ...componentes(p, "postal_town")],
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
  });
}
