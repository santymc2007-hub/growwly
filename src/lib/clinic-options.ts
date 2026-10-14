import { slugify } from "./slugify";

// Longitud a partir de la cual una "descripcion" cuenta como completa
// (ver lib/ai/generar-descripcion-clinica.ts, que genera texto de al
// menos este tamaño) — el importador (admin/clinicas/importar) la usa
// para decidir si un resumen corto ya guardado se puede seguir
// sustituyendo por el texto largo nuevo al completar una ficha existente.
export const DESCRIPCION_MIN_CARACTERES = 800;

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

// Tipo de schema.org más preciso para cada tipo de negocio — importa
// para el structured data de la ficha pública: usar "MedicalBusiness"
// para un centro sin licencia médica (una peluquería, por ejemplo)
// es justo el tipo de imprecisión que penalizan las guías de datos
// estructurados de Google. En España, "clínica" implica un director
// médico colegiado, así que todo lo que lleve esa palabra (o sea un
// centro de injertos, que es cirugía) va como negocio médico.
export const SCHEMA_TYPE_POR_TIPO_NEGOCIO: Record<
  (typeof TIPOS_NEGOCIO)[number],
  string
> = {
  "Clínica capilar": "MedicalBusiness",
  "Clínica de tricología": "MedicalBusiness",
  "Clínica estética": "MedicalBusiness",
  "Clínica médica / hospital": "MedicalBusiness",
  "Centro de injertos capilares": "MedicalBusiness",
  "Peluquería / centro de belleza con servicios capilares": "HairSalon",
  Otro: "LocalBusiness",
};

export function schemaTypeDeClinica(tipoNegocio: string | null): string {
  if (tipoNegocio && tipoNegocio in SCHEMA_TYPE_POR_TIPO_NEGOCIO) {
    return SCHEMA_TYPE_POR_TIPO_NEGOCIO[
      tipoNegocio as (typeof TIPOS_NEGOCIO)[number]
    ];
  }
  // Sin tipo asignado todavía (fichas antiguas, antes de este campo) —
  // fallback seguro y genérico, nunca "MedicalBusiness" sin saberlo.
  return "LocalBusiness";
}

// Nombres de día en español (como se guardan en horarios_estructurados)
// al valor que espera schema.org en DayOfWeek.
const DIA_SCHEMA: Record<string, string> = {
  Lunes: "Monday",
  Martes: "Tuesday",
  Miércoles: "Wednesday",
  Jueves: "Thursday",
  Viernes: "Friday",
  Sábado: "Saturday",
  Domingo: "Sunday",
};

/**
 * Convierte horarios_estructurados ({dia, abierto, desde, hasta}[], en
 * español) al array de OpeningHoursSpecification que espera
 * schema.org — agrupa los días abiertos que comparten el mismo horario
 * en una sola entrada, en vez de una por día.
 */
export function openingHoursSchema(
  horarios: unknown,
): { "@type": "OpeningHoursSpecification"; dayOfWeek: string[]; opens: string; closes: string }[] {
  if (!Array.isArray(horarios)) return [];

  const dias = horarios as { dia?: string; abierto?: boolean; desde?: string; hasta?: string }[];
  const grupos = new Map<string, string[]>();

  for (const d of dias) {
    const diaSchema = d.dia ? DIA_SCHEMA[d.dia] : undefined;
    if (!d.abierto || !diaSchema || !d.desde || !d.hasta) continue;
    const clave = `${d.desde}|${d.hasta}`;
    const lista = grupos.get(clave) ?? [];
    lista.push(diaSchema);
    grupos.set(clave, lista);
  }

  return Array.from(grupos.entries()).map(([clave, dayOfWeek]) => {
    const [opens, closes] = clave.split("|");
    return { "@type": "OpeningHoursSpecification" as const, dayOfWeek, opens, closes };
  });
}

export const CATEGORIAS_TRATAMIENTO = [
  "Diagnóstico y consulta",
  "Tratamientos médicos",
  "Injerto capilar",
  "Estética capilar",
] as const;

export const TECNICAS_POR_CATEGORIA: Record<
  (typeof CATEGORIAS_TRATAMIENTO)[number],
  readonly string[]
> = {
  "Diagnóstico y consulta": ["Consulta tricológica", "Analítica capilar"],
  "Tratamientos médicos": [
    "Minoxidil",
    "Finasteride / Dutasteride",
    "Mesoterapia capilar",
    "Carboxiterapia capilar",
    "PRP",
    "Láser de baja intensidad",
  ],
  "Injerto capilar": [
    "Injerto FUE",
    "Injerto DHI",
    "Injerto FUT",
    "Injerto sin afeitado",
    "Injerto de barba",
    "Injerto de cejas",
  ],
  "Estética capilar": [
    "Micropigmentación capilar",
    "Extensiones de cabello",
    "Pelucas y prótesis capilares",
  ],
} as const;

export const TECNICAS_DISPONIBLES = Object.values(TECNICAS_POR_CATEGORIA).flat();

export function categoriaDeTecnica(tecnica: string): string | null {
  for (const [categoria, tecnicas] of Object.entries(TECNICAS_POR_CATEGORIA)) {
    if ((tecnicas as readonly string[]).includes(tecnica)) return categoria;
  }
  return null;
}

export const ACCESIBILIDAD_OPCIONES = [
  { clave: "entrada_sin_escalones", etiqueta: "Entrada sin escalones" },
  { clave: "pasillos_amplios", etiqueta: "Pasillos amplios" },
  { clave: "aseos_adaptados", etiqueta: "Aseos adaptados" },
  { clave: "mobiliario_ajustable", etiqueta: "Mobiliario clínico ajustable" },
  { clave: "senalizacion_clara", etiqueta: "Señalización clara" },
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
