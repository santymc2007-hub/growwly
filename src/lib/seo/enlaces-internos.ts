import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { slugifyCiudad, slugifyProvincia } from "@/lib/clinic-options";
import type { DestinoEnlace } from "./enlaces-internos-html";

export * from "./enlaces-internos-html";

/**
 * Sinónimos por técnica (clave = valor exacto de TECNICAS_DISPONIBLES).
 * Las tildes no hacen falta: la búsqueda ya las ignora.
 * Ojo con términos genéricos ("láser", "extensiones" sin más) — darían
 * enlaces en frases que no hablan del tratamiento.
 */
const SINONIMOS: Record<string, string[]> = {
  "Consulta tricológica": ["consulta tricológica", "diagnóstico tricológico", "consulta capilar"],
  "Consulta dermatológica": ["consulta dermatológica", "dermatólogo capilar", "dermatología capilar", "dermatólogo"],
  "Analítica capilar": ["analítica capilar", "tricograma", "tricoscopia"],
  Minoxidil: ["minoxidil"],
  "Finasteride / Dutasteride": ["finasteride", "finasterida", "dutasteride", "dutasterida"],
  "Mesoterapia capilar": ["mesoterapia capilar", "mesoterapia"],
  "Carboxiterapia capilar": ["carboxiterapia capilar", "carboxiterapia"],
  PRP: ["plasma rico en plaquetas", "PRP"],
  "Láser de baja intensidad": ["láser de baja intensidad", "láser capilar", "LLLT"],
  "Injerto FUE": ["injerto FUE", "trasplante FUE", "técnica FUE", "FUE"],
  "Injerto DHI": ["injerto DHI", "trasplante DHI", "técnica DHI", "DHI"],
  "Injerto FUT": ["injerto FUT", "técnica de la tira", "FUT"],
  "Injerto sin afeitado": ["injerto sin afeitado", "injerto sin rapar", "FUE sin afeitar", "FUE sin rapar"],
  "Injerto de barba": ["injerto de barba", "trasplante de barba"],
  "Injerto de cejas": ["injerto de cejas", "trasplante de cejas"],
  "Micropigmentación capilar": ["micropigmentación capilar", "micropigmentación"],
  "Extensiones de cabello": ["extensiones de cabello", "extensiones de pelo"],
  "Pelucas y prótesis capilares": ["prótesis capilares", "prótesis capilar", "pelucas"],
};

/** Tratamientos publicados con página propia, listos para enlazar. */
export const getDestinosTratamiento = cache(async (): Promise<DestinoEnlace[]> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("tratamientos")
    .select("slug, nombre, tecnica_relacionada")
    .eq("publicado", true);

  return (data ?? []).map((t) => {
    const terminos = new Set<string>([t.nombre]);
    if (t.tecnica_relacionada) {
      terminos.add(t.tecnica_relacionada);
      for (const s of SINONIMOS[t.tecnica_relacionada] ?? []) terminos.add(s);
    }
    return {
      href: `/tratamientos/${t.slug}`,
      nombre: t.nombre,
      // "Finasteride / Dutasteride" no aparece así en un texto normal.
      terminos: [...terminos].filter((x) => !x.includes("/")),
      tecnica: t.tecnica_relacionada ?? undefined,
      tipo: "tratamiento" as const,
    };
  });
});

/** Ciudades que tienen página propia (al menos un centro publicado). */
export const getDestinosCiudad = cache(async (): Promise<DestinoEnlace[]> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("clinics")
    .select("provincia, ciudad")
    .eq("publicado", true)
    .eq("verificado_admin", true);

  const vistas = new Map<string, DestinoEnlace>();
  for (const c of data ?? []) {
    if (!c.ciudad) continue;
    const href = `/centros/${slugifyProvincia(c.provincia)}/${slugifyCiudad(c.ciudad)}`;
    if (!vistas.has(href)) {
      vistas.set(href, { href, nombre: c.ciudad, terminos: [c.ciudad], tipo: "ciudad" });
    }
  }
  return [...vistas.values()];
});

