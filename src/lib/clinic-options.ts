import { slugify } from "./slugify";

// Las 50 provincias españolas — base para la expansión nacional. Cada
// clínica pertenece a una, usada en la URL (/clinicas/[provincia]/...)
// y en los filtros de admin.
export const PROVINCIAS_ESPANA = [
  "A Coruña",
  "Álava",
  "Albacete",
  "Alicante",
  "Almería",
  "Asturias",
  "Ávila",
  "Badajoz",
  "Barcelona",
  "Bizkaia",
  "Burgos",
  "Cáceres",
  "Cádiz",
  "Cantabria",
  "Castellón",
  "Ciudad Real",
  "Córdoba",
  "Cuenca",
  "Gipuzkoa",
  "Girona",
  "Granada",
  "Guadalajara",
  "Huelva",
  "Huesca",
  "Illes Balears",
  "Jaén",
  "La Rioja",
  "Las Palmas",
  "León",
  "Lleida",
  "Lugo",
  "Madrid",
  "Málaga",
  "Murcia",
  "Navarra",
  "Ourense",
  "Palencia",
  "Pontevedra",
  "Salamanca",
  "Santa Cruz de Tenerife",
  "Segovia",
  "Sevilla",
  "Soria",
  "Tarragona",
  "Teruel",
  "Toledo",
  "Valencia",
  "Valladolid",
  "Zamora",
  "Zaragoza",
] as const;

export function slugifyProvincia(provincia: string): string {
  return slugify(provincia);
}

export function provinciaDesdeSlug(slug: string): string | null {
  return PROVINCIAS_ESPANA.find((p) => slugifyProvincia(p) === slug) ?? null;
}

export const TIPOS_NEGOCIO = [
  "Clínica capilar",
  "Clínica de tricología",
  "Clínica estética",
  "Clínica médica / hospital",
  "Centro de injertos capilares",
  "Peluquería / centro de belleza con servicios capilares",
  "Otro",
] as const;

export const TECNICAS_DISPONIBLES = [
  "Injerto FUE",
  "Injerto DHI",
  "Injerto FUT",
  "Injerto sin afeitado",
  "Mesoterapia capilar",
  "PRP",
  "Micropigmentación capilar",
] as const;

export const IDIOMAS_DISPONIBLES = [
  "Español",
  "Inglés",
  "Francés",
  "Alemán",
  "Italiano",
  "Árabe",
  "Euskera",
] as const;

// 0€, 500€, 1.000€ ... 10.000€
export const PRECIO_OPCIONES: number[] = Array.from(
  { length: 21 },
  (_, i) => i * 500,
);

export function formatearPrecio(valor: number): string {
  return `${valor.toLocaleString("es-ES")}€`;
}

// Los 53 municipios de Mallorca (nombre oficial corto — "Palma", no
// "Palma de Mallorca", para que coincida con los datos ya cargados).
// Usar SIEMPRE esta lista para el campo "ciudad" (fichas y formularios),
// así dos campos nunca dejan de coincidir por una diferencia de texto.
export const MUNICIPIOS_MALLORCA = [
  "Alaró",
  "Alcúdia",
  "Algaida",
  "Andratx",
  "Ariany",
  "Artà",
  "Banyalbufar",
  "Binissalem",
  "Búger",
  "Bunyola",
  "Calvià",
  "Campanet",
  "Campos",
  "Capdepera",
  "Consell",
  "Costitx",
  "Deià",
  "Escorca",
  "Esporles",
  "Estellencs",
  "Felanitx",
  "Fornalutx",
  "Inca",
  "Lloret de Vistalegre",
  "Lloseta",
  "Llubí",
  "Llucmajor",
  "Manacor",
  "Mancor de la Vall",
  "Maria de la Salut",
  "Marratxí",
  "Montuïri",
  "Muro",
  "Palma",
  "Petra",
  "Pollença",
  "Porreres",
  "Puigpunyent",
  "Sa Pobla",
  "Sant Joan",
  "Sant Llorenç des Cardassar",
  "Santa Eugènia",
  "Santa Margalida",
  "Santa Maria del Camí",
  "Santanyí",
  "Selva",
  "Sencelles",
  "Ses Salines",
  "Sineu",
  "Sóller",
  "Son Servera",
  "Valldemossa",
  "Vilafranca de Bonany",
] as const;

/** "Sant Llorenç des Cardassar" -> "sant-llorenc-des-cardassar" */
export function slugifyCiudad(ciudad: string): string {
  return slugify(ciudad);
}

/** A partir del slug de la URL, encuentra el nombre real del municipio (o null). */
export function municipioDesdeSlug(slug: string): string | null {
  return (
    MUNICIPIOS_MALLORCA.find((m) => slugifyCiudad(m) === slug) ?? null
  );
}

/**
 * Igual que municipioDesdeSlug, pero para cualquier provincia: busca el
 * nombre real dentro de una lista de ciudades ya existentes en la BD
 * para esa provincia (no dependemos de tener el callejero completo de
 * toda España — basta con lo que ya tengan cargado las clínicas).
 */
export function municipioDesdeSlugGenerico(
  slug: string,
  ciudadesExistentes: string[],
): string | null {
  return ciudadesExistentes.find((c) => slugifyCiudad(c) === slug) ?? null;
}
