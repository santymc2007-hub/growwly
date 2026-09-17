type RangoUfs = { desde: number; hasta: number };

/**
 * Rangos orientativos de unidades foliculares (UFs) por estadio
 * Norwood-Hamilton — las referencias habituales que se manejan en el
 * sector, no un recuento real: la cifra exacta solo se sabe con una
 * valoración presencial (tricoscopia). Ver analizar-fotos.ts: la IA
 * solo estima el estadio visual, nunca cuenta folículos en la foto.
 */
const RANGO_POR_ESTADIO: Record<number, RangoUfs> = {
  2: { desde: 800, hasta: 1200 },
  3: { desde: 1200, hasta: 1600 },
  4: { desde: 1800, hasta: 2200 },
  5: { desde: 2200, hasta: 2800 },
  6: { desde: 2800, hasta: 3500 },
  7: { desde: 3500, hasta: 4500 },
};

const ROMANOS: Record<string, number> = {
  VII: 7,
  VI: 6,
  V: 5,
  IV: 4,
  III: 3,
  II: 2,
  I: 1,
};

/**
 * Extrae los estadios Norwood-Hamilton mencionados en un texto libre
 * tipo "Norwood II-III" y devuelve el rango combinando el estadio más
 * bajo y el más alto que aparezcan. Null si no hay ningún estadio
 * reconocible, o si el único estadio es el I (sin pérdida relevante,
 * no aplica un rango de injerto).
 */
export function rangoUfsPorNorwood(norwood: string | null): RangoUfs | null {
  if (!norwood) return null;

  const texto = norwood.toUpperCase();
  const estadios: number[] = [];
  for (const [romano, valor] of Object.entries(ROMANOS)) {
    if (new RegExp(`\\b${romano}\\b`).test(texto)) estadios.push(valor);
  }

  const relevantes = estadios.filter((e) => e >= 2 && e <= 7);
  if (relevantes.length === 0) return null;

  const min = Math.min(...relevantes);
  const max = Math.max(...relevantes);
  return {
    desde: RANGO_POR_ESTADIO[min].desde,
    hasta: RANGO_POR_ESTADIO[max].hasta,
  };
}
