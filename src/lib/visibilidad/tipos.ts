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

/**
 * Precios con IVA incluido (decisión de Santy, 20 oct 2026; bajados un
 * 40 % el 27 oct 2026, redondeados al euro). Dos formas
 * de pago: mensual, sin permanencia, o anual (pago de 12 meses, con el
 * precio por mes rebajado). Si cambian, cambiar también /precios.
 */
export const PRECIO_MENSUAL: Record<TipoVisibilidad, number> = {
  destacado: 29,
  destacado_provincia: 36,
  premium: 51,
};

/** Precio por mes en pago anual. */
export const PRECIO_ANUAL_MES: Record<TipoVisibilidad, number> = {
  destacado: 23,
  destacado_provincia: 29,
  premium: 41,
};

export type Periodo = "mensual" | "anual";

/** Descuento del pago anual frente al mensual, en % redondeado. */
export function descuentoAnual(tipo: TipoVisibilidad): number {
  return Math.round((1 - PRECIO_ANUAL_MES[tipo] / PRECIO_MENSUAL[tipo]) * 100);
}

/** Lo que se ahorra en un año pagando el plan anual. */
export function ahorroAnual(tipo: TipoVisibilidad): number {
  return (PRECIO_MENSUAL[tipo] - PRECIO_ANUAL_MES[tipo]) * 12;
}

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
  destacado: `Tu centro aparecerá destacado en la home y en la sección de centros. Solo ${PLAZAS_DESTACADO_GENERAL} plazas para todos los centros de España.`,
  destacado_provincia: `Aparecerás entre los primeros ${PLAZAS_DESTACADO_PROVINCIA} centros cuando el paciente busque por provincia o en los sucesivos filtros.`,
  premium: "Cuanto más completa tu ficha, más tranquilo decide el paciente.",
};

/**
 * Lo que añade el Perfil ampliado a la ficha (panel de la clínica). Debe
 * coincidir con lo que la ficha pública enseña solo si el plan es
 * premium (centros/[provincia]/[ciudad]/[slug]/page.tsx).
 */
export const MEJORAS_PERFIL_AMPLIADO = [
  "Fotos antes/después de tus casos",
  "Opiniones de tus pacientes",
  "Equipo médico, con especialidad y nº de colegiado",
  "Diplomas y certificados",
  "Vídeo de tu clínica",
  "Especialidades y servicios explicados",
  "Precios orientativos y ofertas",
  "Reserva online y redes sociales",
  "Insignia «Perfil detallado» en el listado",
  "Además, te enviamos pacientes: reparto automático de solicitudes",
];

/** Tipo de campaña: para que la clínica entienda qué compra. */
export const CAMPANA_LABEL: Record<TipoVisibilidad, string> = {
  destacado: "Campaña de marca · máximo alcance",
  destacado_provincia: "Campaña de resultado · pacientes con máxima intención",
  premium: "Conversión · más pacientes por cada visita",
};

export const BENEFICIO_LABEL: Record<TipoVisibilidad, string> = {
  destacado: "Visibilidad de marca: es lo primero que ve cualquier visitante de Growwly.",
  destacado_provincia: "Usuarios que buscan directamente en tu zona.",
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
