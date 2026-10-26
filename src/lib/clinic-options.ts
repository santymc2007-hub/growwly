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

// Categorías de centro, ordenadas de la más médica/restrictiva a la
// menos. Selección única: es lo que el centro ES (su actividad
// principal); lo que hace en concreto ya lo recoge el catálogo de
// técnicas. La descripción se muestra junto a cada opción en el
// selector de la ficha para que el centro elija sin dudas.
export const CATEGORIAS_CENTRO = [
  {
    valor: "Hospital con unidad capilar",
    descripcion:
      "Hospital o policlínica con una unidad propia de tricología o trasplante capilar.",
    schemaType: "Hospital",
    palabraSeo: "unidad-capilar",
  },
  {
    valor: "Clínica de trasplante capilar",
    descripcion:
      "Clínica médica cuya actividad principal es el injerto capilar: FUE, DHI o FUT.",
    schemaType: "MedicalClinic",
    palabraSeo: "injerto-capilar",
  },
  {
    valor: "Clínica de tricología",
    descripcion:
      "Clínica capilar con tricólogo: diagnóstico médico de la caída y tratamiento, con o sin injerto.",
    schemaType: "MedicalClinic",
    palabraSeo: "clinica-tricologia",
  },
  {
    valor: "Dermatólogo capilar",
    descripcion:
      "Consulta o clínica de dermatología que trata la caída del cabello, la alopecia y el cuero cabelludo.",
    schemaType: "Physician",
    palabraSeo: "dermatologo-capilar",
  },
  {
    valor: "Clínica estética con unidad capilar",
    descripcion:
      "Medicina estética general con tratamientos capilares médicos: mesoterapia, PRP o carboxiterapia.",
    schemaType: "MedicalClinic",
    palabraSeo: "clinica-estetica",
  },
  {
    valor: "Centro capilar no médico",
    descripcion:
      "Sin personal médico: aparatología, láser, tratamientos tópicos, prótesis y cosmética capilar.",
    schemaType: "HealthAndBeautyBusiness",
    palabraSeo: "centro-capilar",
  },
  {
    valor: "Micropigmentación capilar",
    descripcion:
      "Tatuaje estético que simula densidad o efecto rapado. No trata la caída.",
    schemaType: "HealthAndBeautyBusiness",
    palabraSeo: "micropigmentacion-capilar",
  },
] as const;

export const TIPOS_NEGOCIO = CATEGORIAS_CENTRO.map((c) => c.valor);

export function categoriaCentro(valor: string | null | undefined) {
  return CATEGORIAS_CENTRO.find((c) => c.valor === valor) ?? null;
}

/** Devuelve el valor solo si es una categoría válida (si no, null). */
export function tipoNegocioValido(valor: string | null | undefined): string | null {
  return categoriaCentro(valor)?.valor ?? null;
}

/** Ordena una lista de tipos según el orden de CATEGORIAS_CENTRO (desconocidos al final). */
export function ordenarTiposNegocio(tipos: string[]): string[] {
  const pos = (t: string) => {
    const i = TIPOS_NEGOCIO.indexOf(t as (typeof TIPOS_NEGOCIO)[number]);
    return i === -1 ? Number.MAX_SAFE_INTEGER : i;
  };
  return [...tipos].sort((a, b) => pos(a) - pos(b) || a.localeCompare(b, "es"));
}

// Tipo de schema.org más preciso para cada categoría — "clínica"
// implica autorización sanitaria, así que solo las categorías médicas
// van como MedicalClinic/Hospital; un centro no médico nunca.
export function schemaTypeDeClinica(tipoNegocio: string | null): string {
  // Sin categoría asignada: fallback genérico, nunca médico sin saberlo.
  return categoriaCentro(tipoNegocio)?.schemaType ?? "LocalBusiness";
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
  "Diagnóstico y consulta": ["Consulta tricológica", "Consulta dermatológica", "Analítica capilar"],
  "Tratamientos médicos": [
    "Minoxidil",
    "Finasteride / Dutasteride",
    "Mesoterapia capilar",
    "Carboxiterapia capilar",
    "PRP",
    "Láser y LED de baja intensidad",
    "Radiofrecuencia capilar",
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
    "Cuidado del cuero cabelludo",
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
