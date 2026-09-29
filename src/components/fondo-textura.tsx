import Image from "next/image";

/**
 * Fondo de textura de la web, como una capa aparte con position:fixed
 * en vez de pintarlo directamente en el <main> con
 * background-attachment:fixed. bg-cover con "attachment: fixed" solo
 * calcula el tamaño respecto al viewport si el navegador soporta bien
 * esa propiedad — en Safari de iOS es un soporte históricamente poco
 * fiable. position:fixed sí está garantizado en todos los navegadores,
 * así que esta capa siempre mide el viewport real y bg-cover nunca se
 * calcula respecto a la altura total (y muy alta en móvil) de la
 * página, que es lo que dejaba la textura vista como un trozo enorme
 * y recortado.
 *
 * Usa <Image> en vez de un background-image por CSS: así el navegador
 * pide una versión ya redimensionada y comprimida para su pantalla
 * (mucho más ligera en móvil) en vez de descargar siempre el archivo
 * original de escritorio.
 */
export function FondoTextura() {
  return (
    <div aria-hidden className="fixed inset-0 -z-10">
      <Image
        src="/brand/textura-hojas.webp"
        alt=""
        fill
        sizes="100vw"
        className="object-cover object-top"
      />
    </div>
  );
}
