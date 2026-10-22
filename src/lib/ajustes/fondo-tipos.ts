/**
 * Fondo de toda la web, editable desde /admin/personalizar. Se guarda en
 * la tabla `ajustes_web` (clave "fondo").
 *
 * - original: la textura de hojas de siempre (/brand/textura-hojas.webp).
 * - imagen: una imagen subida desde el admin, a pantalla completa
 *   ("cubrir") o repetida ("mosaico", para texturas pequeñas).
 * - color: un color liso.
 *
 * `velo` (0–90) pone una capa blanca encima para suavizar el fondo y
 * que el texto se lea bien.
 */
export type TipoFondo = "original" | "imagen" | "color";
export type ModoImagen = "cubrir" | "mosaico";

export type FondoWeb = {
  tipo: TipoFondo;
  imagenUrl: string | null;
  color: string;
  modo: ModoImagen;
  velo: number;
};

export const FONDO_ORIGINAL: FondoWeb = {
  tipo: "original",
  imagenUrl: null,
  color: "#eef4f1",
  modo: "cubrir",
  velo: 0,
};

export const IMAGEN_FONDO_ORIGINAL = "/brand/textura-hojas.webp";

const HEX = /^#[0-9a-fA-F]{6}$/;

/** Normaliza lo guardado (o lo que llegue del formulario) a un FondoWeb válido. */
export function normalizarFondo(valor: unknown): FondoWeb {
  const v = (valor ?? {}) as Partial<FondoWeb>;
  const tipo: TipoFondo =
    v.tipo === "imagen" || v.tipo === "color" ? v.tipo : "original";
  const imagenUrl = typeof v.imagenUrl === "string" && v.imagenUrl ? v.imagenUrl : null;
  const velo = Math.min(90, Math.max(0, Math.round(Number(v.velo) || 0)));
  return {
    // Sin imagen subida, "imagen" no tiene nada que pintar.
    tipo: tipo === "imagen" && !imagenUrl ? "original" : tipo,
    imagenUrl,
    color: typeof v.color === "string" && HEX.test(v.color) ? v.color : FONDO_ORIGINAL.color,
    modo: v.modo === "mosaico" ? "mosaico" : "cubrir",
    velo,
  };
}
