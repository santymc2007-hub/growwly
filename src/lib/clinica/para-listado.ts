import type { Clinic } from "@/lib/supabase/database.types";
import { nombreVisibleTecnica } from "@/lib/tecnicas-visibles";

/**
 * Lo que necesitan las tarjetas y el mapa de un listado. VistaListaMapa es
 * un componente de cliente, así que todo lo que recibe va dentro del HTML:
 * con la fila completa de cada clínica viajaban descripciones, reseñas de
 * Google, horarios… (/centros pesaba ~850 KB) y textos que Google Ads lee
 * como contenido de la página de destino (p. ej. nombres de medicamentos
 * con receta en reseñas y descripciones, que hacen rechazar el anuncio).
 */
export const CAMPOS_LISTADO = [
  "id",
  "nombre",
  "slug",
  "provincia",
  "ciudad",
  "zona",
  "fotos",
  "logo_url",
  "tecnicas",
  "tipo_negocio",
  "rating_google",
  "financiacion",
  "primera_consulta_gratis",
  "plan",
  "tiene_oferta",
  "verificado",
  "lat",
  "lng",
] as const satisfies readonly (keyof Clinic)[];

export type ClinicListado = Pick<Clinic, (typeof CAMPOS_LISTADO)[number]>;

export function paraListado(c: Clinic): ClinicListado {
  return {
    id: c.id,
    nombre: c.nombre,
    slug: c.slug,
    provincia: c.provincia,
    ciudad: c.ciudad,
    zona: c.zona,
    // La tarjeta solo enseña la primera foto.
    fotos: c.fotos.slice(0, 1),
    logo_url: c.logo_url,
    // Nombre visible también en los datos: lo que viaja al navegador lo lee
    // Google Ads como texto de la página de destino.
    tecnicas: c.tecnicas.map(nombreVisibleTecnica),
    tipo_negocio: c.tipo_negocio,
    rating_google: c.rating_google,
    financiacion: c.financiacion,
    primera_consulta_gratis: c.primera_consulta_gratis,
    plan: c.plan,
    tiene_oferta: c.tiene_oferta,
    verificado: c.verificado,
    lat: c.lat,
    lng: c.lng,
  };
}
