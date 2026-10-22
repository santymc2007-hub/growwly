import { obtenerFondoWeb } from "@/lib/ajustes/fondo";
import { CapaFondo } from "./capa-fondo";

/**
 * Fondo de la web, como una capa aparte con position:fixed en vez de
 * pintarlo directamente en el <main> con background-attachment:fixed
 * (en Safari de iOS ese soporte es poco fiable y la textura se veía
 * como un trozo enorme y recortado).
 *
 * Qué fondo se pinta se elige en /admin/personalizar (ver
 * src/lib/ajustes/fondo.ts). Por defecto, la textura de hojas.
 */
export async function FondoTextura() {
  const fondo = await obtenerFondoWeb();
  return <CapaFondo fondo={fondo} />;
}
