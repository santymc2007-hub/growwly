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
