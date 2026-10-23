/**
 * Datos comparables de cada clínica (buscador/comparador con IA, oct
 * 2026): opciones fijas, valores añadidos y precios por tratamiento.
 * Este archivo no importa nada de servidor: lo usan tanto el formulario
 * de la ficha (cliente) como las acciones y la ficha pública.
 */

export const FINANCIACION_OPCIONES = [
  { valor: "no", etiqueta: "No" },
  { valor: "si", etiqueta: "Sí" },
  { valor: "con_intereses", etiqueta: "Sí, con intereses" },
  { valor: "sin_intereses", etiqueta: "Sí, sin intereses" },
] as const;

export const PARKING_OPCIONES = [
  { valor: "propio_gratis", etiqueta: "Propio y gratuito" },
  { valor: "propio_pago", etiqueta: "Propio, de pago" },
  { valor: "cercano", etiqueta: "Parking cercano" },
  { valor: "no", etiqueta: "No" },
] as const;

export const QUIEN_OPERA_OPCIONES = [
  { valor: "medico", etiqueta: "Toda la intervención la hace el médico" },
  { valor: "medico_equipo", etiqueta: "Médico con equipo técnico" },
] as const;

export const REVISIONES_OPCIONES = [1, 2, 3, 4, 5] as const;
export const SEGUIMIENTO_OPCIONES = [6, 12, 18, 24] as const;

export const CATEGORIAS_VENTAJA = [
  { valor: "dia_intervencion", etiqueta: "El día de la intervención" },
  { valor: "despues", etiqueta: "Después de la intervención" },
  { valor: "acceso", etiqueta: "Acceso y horarios" },
  { valor: "confianza", etiqueta: "Confianza" },
  { valor: "otros", etiqueta: "Otros" },
] as const;

export const MODALIDADES_PRECIO = [
  { valor: "total", etiqueta: "Precio total" },
  { valor: "sesion", etiqueta: "Por sesión" },
  { valor: "bono", etiqueta: "Por bono" },
  { valor: "uf", etiqueta: "Por unidad folicular" },
  { valor: "norwood", etiqueta: "Según grado Norwood" },
] as const;

/** Tramos de Norwood agrupados: lo que da la valoración con IA. */
export const TRAMOS_NORWOOD = ["II-III", "IV-V", "VI-VII"] as const;

export type Modalidad = (typeof MODALIDADES_PRECIO)[number]["valor"];
export type TramoNorwood = (typeof TRAMOS_NORWOOD)[number];

export type FilaPrecio = {
  tratamiento: string;
  modalidad: Modalidad;
  desde: number | null;
  hasta: number | null;
  norwood: Partial<Record<TramoNorwood, { desde: number | null; hasta: number | null }>> | null;
  nota: string | null;
  visible: boolean;
};

export const MAX_FILAS_PRECIO = 30;

/** Lo que reciben los formularios de ficha (clínica y admin). */
export type ComparablesFicha = {
  precios: FilaPrecio[];
  sugerenciasTratamientos: string[];
  ventajas: { id: string; nombre: string; categoria: string }[];
  seleccionadas: string[];
  propuestas: { id: string; nombre: string }[];
};

function etiqueta<T extends readonly { valor: string; etiqueta: string }[]>(
  lista: T,
  valor: string | null | undefined,
): string | null {
  return lista.find((o) => o.valor === valor)?.etiqueta ?? null;
}

export const etiquetaFinanciacion = (v: string | null | undefined) =>
  etiqueta(FINANCIACION_OPCIONES, v);
export const etiquetaParking = (v: string | null | undefined) => etiqueta(PARKING_OPCIONES, v);
export const etiquetaQuienOpera = (v: string | null | undefined) =>
  etiqueta(QUIEN_OPERA_OPCIONES, v);
export const etiquetaModalidad = (v: string | null | undefined) =>
  etiqueta(MODALIDADES_PRECIO, v);

function numero(v: unknown, max = 1_000_000): number | null {
  const n = typeof v === "number" ? v : Number(String(v ?? "").replace(/[^\d]/g, ""));
  return Number.isFinite(n) && String(v ?? "").trim() !== "" && n >= 0 && n <= max
    ? Math.round(n)
    : null;
}

/** Valida lo que manda el editor de precios (JSON) y lo deja limpio. */
export function parsearFilasPrecio(json: string | null): FilaPrecio[] {
  let bruto: unknown;
  try {
    bruto = JSON.parse(json ?? "[]");
  } catch {
    return [];
  }
  if (!Array.isArray(bruto)) return [];
  const modalidades = MODALIDADES_PRECIO.map((m) => m.valor) as string[];
  const out: FilaPrecio[] = [];
  for (const f of bruto.slice(0, MAX_FILAS_PRECIO)) {
    if (!f || typeof f !== "object") continue;
    const r = f as Record<string, unknown>;
    const tratamiento = String(r.tratamiento ?? "").trim().slice(0, 120);
    if (!tratamiento) continue;
    const modalidad = (modalidades.includes(String(r.modalidad)) ? r.modalidad : "total") as Modalidad;
    let norwood: FilaPrecio["norwood"] = null;
    if (modalidad === "norwood" && r.norwood && typeof r.norwood === "object") {
      norwood = {};
      for (const t of TRAMOS_NORWOOD) {
        const tramo = (r.norwood as Record<string, Record<string, unknown> | undefined>)[t];
        const d = numero(tramo?.desde);
        const h = numero(tramo?.hasta);
        if (d !== null || h !== null) norwood[t] = { desde: d, hasta: h };
      }
    }
    out.push({
      tratamiento: tratamiento.charAt(0).toUpperCase() + tratamiento.slice(1),
      modalidad,
      desde: modalidad === "norwood" ? null : numero(r.desde),
      hasta: modalidad === "norwood" ? null : numero(r.hasta),
      norwood,
      nota: String(r.nota ?? "").trim().slice(0, 200) || null,
      visible: r.visible !== false,
    });
  }
  return out;
}

/** Desde/hasta de una fila, contando los tramos de Norwood. */
export function rangoDeFila(f: Pick<FilaPrecio, "desde" | "hasta" | "norwood">): {
  desde: number | null;
  hasta: number | null;
} {
  const valores = [f.desde, f.hasta];
  for (const t of Object.values(f.norwood ?? {})) valores.push(t?.desde ?? null, t?.hasta ?? null);
  const nums = valores.filter((v): v is number => typeof v === "number");
  if (!nums.length) return { desde: null, hasta: null };
  return { desde: Math.min(...nums), hasta: Math.max(...nums) };
}

export function formatearEuros(n: number): string {
  return `${n.toLocaleString("es-ES")} €`;
}

/** "1.500 – 3.000 €", "Desde 1.500 €"… o null si no hay cifras. */
export function textoRango(desde: number | null, hasta: number | null): string | null {
  if (desde !== null && hasta !== null && desde !== hasta)
    return `${desde.toLocaleString("es-ES")} – ${formatearEuros(hasta)}`;
  if (desde !== null) return `Desde ${formatearEuros(desde)}`;
  if (hasta !== null) return `Hasta ${formatearEuros(hasta)}`;
  return null;
}
