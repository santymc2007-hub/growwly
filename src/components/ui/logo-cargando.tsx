/**
 * Animación de carga con el logo de Growwly: el logo aparece en gris
 * claro y se va "rellenando" de izquierda a derecha con sus colores,
 * en bucle. Con "reducir movimiento" activado, solo late suavemente.
 *
 * Son dos copias del mismo logo apiladas; la de color se recorta con
 * clip-path (estilos .logo-cargando-* en globals.css). Se usa <img> y no
 * next/image a propósito: es un recurso pequeño que tiene que verse al
 * instante, sin esperar a la optimización.
 */
export function LogoCargando({
  ancho = 180,
  etiqueta = "Cargando",
  className = "",
}: {
  /** Ancho del logo en px (el alto sale de la proporción). */
  ancho?: number;
  /** Texto para lectores de pantalla. */
  etiqueta?: string;
  className?: string;
}) {
  return (
    <div
      role="status"
      aria-label={etiqueta}
      className={`logo-cargando relative inline-block ${className}`}
      style={{ width: ancho, aspectRatio: "889 / 303" }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/brand/growwly-logo-verde.png"
        alt=""
        aria-hidden
        className="logo-cargando-base absolute inset-0 h-full w-full"
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/brand/growwly-logo-verde.png"
        alt=""
        aria-hidden
        className="logo-cargando-relleno absolute inset-0 h-full w-full"
      />
    </div>
  );
}
