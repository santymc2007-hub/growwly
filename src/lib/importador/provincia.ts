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

// Categorías de Google que nunca son un centro capilar.
const CATEGORIA_AJENA =
  /farmacia|parafarmacia|tienda|supermercado|droguer|perfumer|dentist|odontolog|veterinar|gimnasio|spa\b|masaje|fisioterap|optic|óptic|tatuaje|barber/;
// Peluquerías: solo valen si la ficha habla de pérdida de cabello/prótesis.
const PELUQUERIA = /peluquer|sal[oó]n de belleza|hair salon|estilista/;
const SENAL_CAPILAR =
  /capilar|tricolog|alopecia|injerto|trasplante|pr[oó]tesis|peluca|micropigment|ca[ií]da del (pelo|cabello)|integraci[oó]n/;

export type Clasificacion =
  | { estado: "pendiente"; motivo: null }
  | { estado: "descartado"; motivo: string };

export function clasificar(l: LugarApify, provincia: string): Clasificacion {
  if (l.permanentlyClosed) return { estado: "descartado", motivo: "Cerrado permanentemente" };
  if (l.countryCode && l.countryCode.toUpperCase() !== "ES")
    return { estado: "descartado", motivo: "Fuera de España" };

  const prefijo = prefijoCp(provincia);
  const cp = cpDe(l);
  if (prefijo && cp && !cp.startsWith(prefijo))
    return { estado: "descartado", motivo: `Fuera de la provincia (CP ${cp})` };

  const categorias = sinAcentos([l.categoryName ?? "", ...(l.categories ?? [])].join(" | "));
  const texto = sinAcentos(`${l.title ?? ""} ${categorias}`);

  if (CATEGORIA_AJENA.test(categorias) && !SENAL_CAPILAR.test(texto))
    return { estado: "descartado", motivo: `Categoría ajena (${l.categoryName ?? "?"})` };
  if (PELUQUERIA.test(categorias) && !SENAL_CAPILAR.test(texto))
    return { estado: "descartado", motivo: "Peluquería sin señales capilares" };

  return { estado: "pendiente", motivo: null };
}

/** Municipio tal como lo da Google (para sembrar la tabla `municipios`). */
export function municipioDe(l: LugarApify): string | null {
  const c = l.city?.trim();
  return c ? c : null;
}
