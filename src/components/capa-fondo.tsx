import Image from "next/image";
import { IMAGEN_FONDO_ORIGINAL, type FondoWeb } from "@/lib/ajustes/fondo-tipos";

/** La capa en sí; también la usa la vista previa del admin. */
export function CapaFondo({
  fondo,
  fija = true,
}: {
  fondo: FondoWeb;
  /** false en la vista previa del admin (capa dentro de una caja). */
  fija?: boolean;
}) {
  const posicion = fija ? "fixed inset-0 -z-10" : "absolute inset-0";

  return (
    <div aria-hidden className={`${posicion} overflow-hidden`} style={{ backgroundColor: fondo.color }}>
      {fondo.tipo === "original" && (
        // <Image>: el navegador pide una versión redimensionada para su
        // pantalla (mucho más ligera en móvil).
        <Image
          src={IMAGEN_FONDO_ORIGINAL}
          alt=""
          fill
          sizes="100vw"
          className="object-cover object-top"
        />
      )}

      {fondo.tipo === "imagen" && fondo.imagenUrl && fondo.modo === "cubrir" && (
        <Image
          src={fondo.imagenUrl}
          alt=""
          fill
          sizes="100vw"
          className="object-cover object-top"
          // Vista previa del admin: imagen local aún sin subir (blob:).
          unoptimized={fondo.imagenUrl.startsWith("blob:")}
        />
      )}

      {fondo.tipo === "imagen" && fondo.imagenUrl && fondo.modo === "mosaico" && (
        <div
          className="absolute inset-0"
          style={{ backgroundImage: `url("${fondo.imagenUrl}")`, backgroundRepeat: "repeat" }}
        />
      )}

      {fondo.velo > 0 && (
        <div className="absolute inset-0 bg-white" style={{ opacity: fondo.velo / 100 }} />
      )}
    </div>
  );
}
