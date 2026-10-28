import { CargadorW } from "./cargador-w";

/**
 * Animación de carga de Growwly. Desde el 28 oct 2026 es la misma en
 * toda la web: la W que se llena con las estrellas saliendo (ver
 * CargadorW). Se mantiene este nombre para no tocar cada pantalla.
 */
export function LogoCargando({
  ancho = 120,
  etiqueta = "Cargando",
  className = "",
}: {
  /** Ancho del cargador en px. */
  ancho?: number;
  /** Texto para lectores de pantalla. */
  etiqueta?: string;
  className?: string;
}) {
  return <CargadorW tamano={ancho} etiqueta={etiqueta} className={className} />;
}
