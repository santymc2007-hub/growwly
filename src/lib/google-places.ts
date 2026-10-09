const CAMPOS_DETALLE = [
  "rating",
  "userRatingCount",
  "location",
  "reviews",
  "googleMapsUri",
].join(",");

type PlaceReview = {
  rating?: number;
  text?: { text?: string };
  authorAttribution?: { displayName?: string };
  publishTime?: string;
  relativePublishTimeDescription?: string;
};

type PlaceDetailsResponse = {
  rating?: number;
  userRatingCount?: number;
  location?: { latitude?: number; longitude?: number };
  reviews?: PlaceReview[];
  googleMapsUri?: string;
};

export type ReseniaGoogle = {
  autor: string;
  texto: string;
  puntuacion: number;
  fecha: string | null;
};

export type DetallesPlaceGoogle = {
  rating: number | null;
  totalResenas: number | null;
  lat: number | null;
  lng: number | null;
  resenas: ReseniaGoogle[];
  mapsUri: string | null;
};

/**
 * Consulta Place Details (Places API New) para un place_id ya
 * confirmado. Las reseñas que devuelve Google son como mucho 5 (las
 * "más relevantes"), no el listado completo — es una limitación de la
 * API, no nuestra. languageCode=es le pide a Google que, cuando pueda,
 * devuelva el texto de la reseña ya traducido al español — la web es
 * solo en español, así que no tiene sentido enseñar una reseña en otro
 * idioma solo porque el autor la escribió así en Google Maps.
 */
export async function obtenerDetallesPlace(placeId: string): Promise<DetallesPlaceGoogle> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) throw new Error("Falta GOOGLE_PLACES_API_KEY");

  const res = await fetch(
    `https://places.googleapis.com/v1/places/${placeId}?languageCode=es`,
    {
      headers: {
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": CAMPOS_DETALLE,
      },
    },
  );

  if (!res.ok) {
    throw new Error(`Places API respondió ${res.status}: ${await res.text()}`);
  }

  const data: PlaceDetailsResponse = await res.json();

  return {
    rating: data.rating ?? null,
    totalResenas: data.userRatingCount ?? null,
    lat: data.location?.latitude ?? null,
    lng: data.location?.longitude ?? null,
    mapsUri: data.googleMapsUri ?? null,
    resenas: (data.reviews ?? []).map((r) => ({
      autor: r.authorAttribution?.displayName ?? "Usuario de Google",
      texto: r.text?.text ?? "",
      puntuacion: r.rating ?? 5,
      fecha: r.publishTime ?? null,
    })),
  };
}

/**
 * Busca candidatos de Place ID por nombre + dirección (Text Search).
 * Solo para el emparejamiento manual inicial de una clínica nueva —
 * el resultado siempre se debe confirmar a mano antes de guardar
 * google_place_id, nunca guardarlo automáticamente.
 */
export async function buscarCandidatosPlace(textoConsulta: string) {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) throw new Error("Falta GOOGLE_PLACES_API_KEY");

  const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask":
        "places.id,places.displayName,places.formattedAddress,places.rating,places.userRatingCount",
    },
    body: JSON.stringify({ textQuery: textoConsulta, languageCode: "es" }),
  });

  if (!res.ok) {
    throw new Error(`Places API respondió ${res.status}: ${await res.text()}`);
  }

  const data: {
    places?: {
      id: string;
      displayName?: { text?: string };
      formattedAddress?: string;
      rating?: number;
      userRatingCount?: number;
    }[];
  } = await res.json();

  return (data.places ?? []).map((p) => ({
    placeId: p.id,
    nombre: p.displayName?.text ?? "",
    direccion: p.formattedAddress ?? "",
    rating: p.rating ?? null,
    totalResenas: p.userRatingCount ?? null,
  }));
}
