// Filtro automático de los resultados de Apify para una provincia.
// Regla: ante la duda, se deja pendiente (lo revisa el admin); solo se
// descarta lo que claramente no es un centro capilar de esa provincia.

import { sinAcentos } from "./normalizar";
import type { LugarApify } from "./apify";

/** Prefijo de código postal (2 primeras cifras) de cada provincia. */
const CP_PROVINCIA: Record<string, string> = {
  "Álava": "01", Albacete: "02", Alicante: "03", "Almería": "04", "Ávila": "05",
  Badajoz: "06", "Illes Balears": "07", Barcelona: "08", Burgos: "09", "Cáceres": "10",
  "Cádiz": "11", "Castellón": "12", "Ciudad Real": "13", "Córdoba": "14", "A Coruña": "15",
  Cuenca: "16", Girona: "17", Granada: "18", Guadalajara: "19", Gipuzkoa: "20",
  Huelva: "21", Huesca: "22", "Jaén": "23", "León": "24", Lleida: "25",
  "La Rioja": "26", Lugo: "27", Madrid: "28", "Málaga": "29", Murcia: "30",
  Navarra: "31", Ourense: "32", Asturias: "33", Palencia: "34", "Las Palmas": "35",
  Pontevedra: "36", Salamanca: "37", "Santa Cruz de Tenerife": "38", Cantabria: "39",
  Segovia: "40", Sevilla: "41", Soria: "42", Tarragona: "43", Teruel: "44",
  Toledo: "45", Valencia: "46", Valladolid: "47", Bizkaia: "48", Zamora: "49", Zaragoza: "50",
};

export function prefijoCp(provincia: string): string | null {
  return CP_PROVINCIA[provincia] ?? null;
}

function cpDe(l: LugarApify): string | null {
  if (l.postalCode && /^\d{5}$/.test(l.postalCode.trim())) return l.postalCode.trim();
  const m = l.address?.match(/\b(\d{5})\b/);
  return m ? m[1] : null;
}

// Todo se compara sin acentos y en minúsculas (sinAcentos).

// Señal clara de salud capilar en el nombre o en las categorías de Google.
const SENAL_CAPILAR =
  /capilar|tricolog|alopecia|injerto|trasplante (de )?(pelo|cabello|capilar)|hair (transplant|clinic|loss|restoration)|implante capilar|micropigmentacion capilar|caida del (pelo|cabello)|pelo|cabello|trichol/;

// Centros médicos donde es razonable que traten la alopecia aunque Google
// no lo diga: entran como pendientes, marcados para comprobar en su web.
const MEDICO_PLAUSIBLE =
  /dermatolog|medicina estetica|cirujano plastico|cirugia plastica|cirugia estetica|clinica medica|centro medico|hospital|policlinic|medico general|consultorio medico|clinica de estetica medica/;

// Especialidades médicas que nunca tratan el cabello (aunque digan "estética").
const MEDICO_AJENO =
  /maxilofacial|dental|dentist|odontolog|ortodonc|implante dental|oftalmolog|ginecolog|fisioterap|podolog|psicolog|nutricion|veterinar|optic|audiolog|logoped|traumatolog/;

export type Clasificacion =
  | { estado: "pendiente"; motivo: string | null }
  | { estado: "descartado"; motivo: string };

/**
 * Regla: solo pasa lo que tenga señal capilar clara, o un centro médico
 * plausible (dermatología, medicina estética, cirugía plástica…) que se
 * marca para comprobar. Peluquerías, uñas, estética facial, maquillaje,
 * barberías, etc. sin señal capilar se descartan (se pueden recuperar).
 */
export function clasificar(l: LugarApify, provincia: string): Clasificacion {
  if (l.permanentlyClosed) return { estado: "descartado", motivo: "Cerrado permanentemente" };
  if (l.countryCode && l.countryCode.toUpperCase() !== "ES")
    return { estado: "descartado", motivo: "Fuera de España" };

  const prefijo = prefijoCp(provincia);
  const cp = cpDe(l);
  if (prefijo && cp && !cp.startsWith(prefijo))
    return { estado: "descartado", motivo: `Fuera de la provincia (CP ${cp})` };

  const categorias = sinAcentos([l.categoryName ?? "", ...(l.categories ?? [])].join(" | "));
  const nombre = sinAcentos(l.title ?? "");
  const etiqueta = l.categoryName ?? "sin categoría";

  if (MEDICO_AJENO.test(categorias) && !SENAL_CAPILAR.test(nombre))
    return { estado: "descartado", motivo: `Especialidad ajena (${etiqueta})` };

  // "pelo"/"cabello" en una peluquería no es señal: ahí solo valen las fuertes.
  const esPeluqueria = /peluquer|barber|salon de belleza|hair salon|estilista/.test(categorias);
  const senalFuerte = /capilar|tricolog|alopecia|injerto|trasplante|implante capilar|protesis|peluca|micropigment|hair (transplant|loss|restoration)/;
  if (esPeluqueria)
    return senalFuerte.test(`${nombre} ${categorias}`)
      ? { estado: "pendiente", motivo: "Peluquería con servicio capilar: comprobar" }
      : { estado: "descartado", motivo: `Peluquería sin servicio capilar (${etiqueta})` };

  if (SENAL_CAPILAR.test(`${nombre} ${categorias}`)) return { estado: "pendiente", motivo: null };
  if (MEDICO_PLAUSIBLE.test(categorias))
    return { estado: "pendiente", motivo: `Comprobar en su web si trata el cabello (${etiqueta})` };

  return { estado: "descartado", motivo: `Sin relación capilar (${etiqueta})` };
}

/** Municipio tal como lo da Google (para sembrar la tabla `municipios`). */
export function municipioDe(l: LugarApify): string | null {
  const c = l.city?.trim();
  return c ? c : null;
}
