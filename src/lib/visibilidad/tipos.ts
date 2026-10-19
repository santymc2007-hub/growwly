/**
 * Tipos, plazas y textos de la visibilidad de pago. Sin dependencias de
 * servidor: lo pueden importar componentes de cliente. La lógica (plazas
 * ocupadas, orden de los listados) está en ./destacados.ts.
 *
 * Decisión de Santy, 19 oct 2026. Dos destacados:
 *
 * - **General** (`destacado`): 8 plazas en total, haya una provincia
 *   abierta o veinte. Sale en la portada y primero en /centros cuando
 *   no se ha elegido provincia (también con otros filtros, mientras los
 *   cumpla, y en las páginas de tratamiento).
 * - **De provincia** (`destacado_provincia`): 8 plazas por provincia.
 *   Sale primero en /centros en cuanto se filtra por su provincia (o
 *   por una ciudad suya) y en las páginas de ciudad. El resto de
 *   filtros solo quita a los que no los cumplen.
 *
 * Si esto cambia, cambiar también /como-ordenamos y /precios.
 */
import type { Database } from "@/lib/supabase/database.types";

export const PLAZAS_DESTACADO_GENERAL = 8;
export const PLAZAS_DESTACADO_PROVINCIA = 8;

export type TipoVisibilidad = "destacado" | "destacado_provincia" | "premium";
export type TipoDestacado = Exclude<TipoVisibilidad, "premium">;

export type Plazas = { ocupadas: number; total: number; libres: number };

/** Precio mensual (decisión de Santy, 19 oct 2026). */
export const PRECIO_MENSUAL: Record<TipoVisibilidad, number> = {
  destacado: 49,
  destacado_provincia: 60,
  premium: 85,
};

/** Descuento por contratar varios meses seguidos (modelo de precios v4). */
export const DESCUENTO_POR_MESES: Record<number, number> = { 3: 5, 6: 15, 12: 20 };

// Textos que ven la clínica (panel) y el admin, y que van en el email de
// activación.
export const TIPO_LABEL: Record<TipoVisibilidad, string> = {
  destacado: "Destacado general",
  destacado_provincia: "Destacado en tu provincia",
  premium: "Perfil ampliado",
};

/** Para el historial: incluye los tipos que existieron antes del 19 oct 2026. */
export const TIPO_LABEL_HISTORIAL: Record<string, string> = {
  ...TIPO_LABEL,
  destacado_home: "Destacado en la Home (antiguo)",
  destacado_ciudad: "Destacado en la ciudad (antiguo)",
};

export const DESCRIPCION_LABEL: Record<TipoVisibilidad, string> = {
  destacado: `En la portada y entre los primeros del listado de centros. ${PLAZAS_DESTACADO_GENERAL} plazas en toda España.`,
  destacado_provincia: `Entre los primeros cuando el paciente busca centros en tu provincia o en tu ciudad. ${PLAZAS_DESTACADO_PROVINCIA} plazas por provincia.`,
  premium: "Fotos antes/después, opiniones, certificados, contacto directo y más en tu ficha.",
};

export const BENEFICIO_LABEL: Record<TipoVisibilidad, string> = {
  destacado: "Visibilidad de marca: es lo primero que ve cualquier visitante de Growwly.",
  destacado_provincia: "Más cerca de la decisión: te ven primero quienes buscan en tu zona.",
  premium: "Ficha completa = más confianza del paciente = más leads convertidos.",
};

/** Columnas de cada tipo de destacado en `clinics`. */
export const CAMPOS_DESTACADO = {
  destacado: { activo: "destacado", solicitado: "destacado_solicitado" },
  destacado_provincia: { activo: "destacado_provincia", solicitado: "destacado_provincia_solicitado" },
} as const;

type ClinicUpdate = Database["public"]["Tables"]["clinics"]["Update"];

/**
 * Cambio en `clinics` para un tipo de destacado, con las columnas con
 * nombre (los objetos con clave calculada no pasan el tipado de Supabase).
 */
export function camposDestacado(
  tipo: TipoDestacado,
  valores: { activo?: boolean; solicitado?: boolean },
): ClinicUpdate {
  const cambio: ClinicUpdate = {};
  if (tipo === "destacado") {
    if (valores.activo !== undefined) cambio.destacado = valores.activo;
    if (valores.solicitado !== undefined) cambio.destacado_solicitado = valores.solicitado;
  } else {
    if (valores.activo !== undefined) cambio.destacado_provincia = valores.activo;
    if (valores.solicitado !== undefined) cambio.destacado_provincia_solicitado = valores.solicitado;
  }
  return cambio;
}
