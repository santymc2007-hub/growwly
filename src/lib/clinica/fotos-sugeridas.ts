// Banco de fotos orientativas por tratamiento (public/fotos-sugeridas).
// Llevan la marca "Imagen orientativa" grabada. Sirven de relleno cuando
// una clínica no tiene fotos o son malas: el admin las añade con un clic.
// Para añadir más, se copian a public/fotos-sugeridas/<slug>/NN.webp y se
// listan aquí.

import { SITE_URL } from "@/lib/site-url";

type Grupo = { slug: string; tecnicas: string[]; archivos: string[] };

const GRUPOS: Grupo[] = [
  { slug: "analitica-capilar", tecnicas: ["Analítica capilar"], archivos: ["01.webp", "02.webp", "03.webp", "04.webp", "05.webp"] },
  { slug: "consulta-tricologica", tecnicas: ["Consulta tricológica", "Consulta dermatológica"], archivos: ["01.webp", "02.webp", "03.webp", "04.webp", "05.webp"] },
  { slug: "extensiones-de-cabello", tecnicas: ["Extensiones de cabello"], archivos: ["01.webp", "02.webp", "03.webp", "04.webp", "05.webp"] },
  { slug: "finasteride-dutasteride", tecnicas: ["Finasteride / Dutasteride"], archivos: ["01.webp", "02.webp", "03.webp", "04.webp", "05.webp"] },
  { slug: "injerto-capilar-dhi", tecnicas: ["Injerto DHI"], archivos: ["01.webp", "02.webp", "03.webp", "04.webp", "05.webp"] },
  { slug: "injerto-capilar-fue", tecnicas: ["Injerto FUE"], archivos: ["01.webp", "02.webp", "03.webp", "04.webp", "05.webp"] },
  { slug: "injerto-capilar-fut", tecnicas: ["Injerto FUT"], archivos: ["01.webp", "02.webp", "03.webp", "04.webp", "05.webp"] },
  { slug: "injerto-de-barba", tecnicas: ["Injerto de barba"], archivos: ["01.webp", "02.webp", "03.webp", "04.webp", "05.webp"] },
  { slug: "injerto-de-cejas", tecnicas: ["Injerto de cejas"], archivos: ["01.webp", "02.webp", "03.webp", "04.webp", "05.webp"] },
  { slug: "injerto-sin-afeitado", tecnicas: ["Injerto sin afeitado"], archivos: ["01.webp", "02.webp", "03.webp", "04.webp", "05.webp"] },
  { slug: "laser-baja-intensidad", tecnicas: ["Láser y LED de baja intensidad", "Láser de baja intensidad"], archivos: ["01.webp", "02.webp", "03.webp", "04.webp", "05.webp"] },
  { slug: "mesoterapia-capilar", tecnicas: ["Mesoterapia capilar"], archivos: ["01.webp", "02.webp", "03.webp", "04.webp", "05.webp"] },
  { slug: "micropigmentacion-capilar", tecnicas: ["Micropigmentación capilar"], archivos: ["01.webp", "02.webp", "03.webp", "04.webp", "05.webp"] },
  { slug: "minoxidil", tecnicas: ["Minoxidil"], archivos: ["01.webp", "02.webp", "03.webp", "04.webp", "05.webp"] },
  { slug: "pelucas-protesis-capilares", tecnicas: ["Pelucas y prótesis capilares"], archivos: ["01.webp", "02.webp", "03.webp", "04.webp", "05.webp"] },
  { slug: "prp", tecnicas: ["PRP"], archivos: ["01.webp", "02.webp", "03.webp", "04.webp", "05.webp"] },
];

export type GrupoFotosSugeridas = { slug: string; titulo: string; urls: string[]; deLaClinica: boolean };

/** URL absoluta (las fotos de las fichas se usan también en JSON-LD y Open Graph). */
export function urlFotoSugerida(slug: string, archivo: string): string {
  return `${SITE_URL}/fotos-sugeridas/${slug}/${archivo}`;
}

export function esFotoSugerida(url: string): boolean {
  return url.includes("/fotos-sugeridas/");
}

/** Todos los grupos, primero los de las técnicas que tiene la clínica. */
export function fotosSugeridas(tecnicasClinica: string[]): GrupoFotosSugeridas[] {
  const suyas = new Set(tecnicasClinica);
  return GRUPOS.map((g) => ({
    slug: g.slug,
    titulo: g.tecnicas[0],
    urls: g.archivos.map((a) => urlFotoSugerida(g.slug, a)),
    deLaClinica: g.tecnicas.some((t) => suyas.has(t)),
  })).sort((a, b) => Number(b.deLaClinica) - Number(a.deLaClinica));
}
