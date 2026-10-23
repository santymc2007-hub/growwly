import { createAdminClient } from "@/lib/supabase/admin";
import { slugifyCiudad, slugifyProvincia } from "@/lib/clinic-options";

/**
 * /llms.txt: resumen de Growwly para asistentes de IA (ChatGPT, Claude,
 * Perplexity…), en el formato propuesto en llmstxt.org. Se genera con los
 * centros, tratamientos y guías publicados, y se regenera una vez al día.
 * Solo datos públicos de Growwly (nada de Google Places ni de pacientes).
 */
export const revalidate = 86400;

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.growwly.es";

const limpiar = (t: string | null | undefined) => (t ?? "").replace(/\s+/g, " ").trim();

export async function GET() {
  const supabase = createAdminClient();
  const [{ data: clinicas }, { data: tratamientos }, { data: posts }] = await Promise.all([
    supabase
      .from("clinics")
      .select("nombre, slug, provincia, ciudad")
      .eq("publicado", true)
      .eq("verificado_admin", true)
      .order("nombre"),
    supabase.from("tratamientos").select("nombre, slug, resumen").eq("publicado", true).order("nombre"),
    supabase.from("blog_posts").select("titulo, slug, resumen").eq("publicado", true).order("titulo"),
  ]);

  const conCiudad = (clinicas ?? []).filter((c) => c.ciudad);
  const ciudades = new Map<string, { nombre: string; url: string; n: number }>();
  for (const c of conCiudad) {
    const url = `${siteUrl}/centros/${slugifyProvincia(c.provincia)}/${slugifyCiudad(c.ciudad!)}`;
    const actual = ciudades.get(url);
    ciudades.set(url, { nombre: c.ciudad!, url, n: (actual?.n ?? 0) + 1 });
  }

  // Zona cubierta, sacada de los centros publicados: "Mallorca" mientras
  // todo esté en Baleares; al abrir provincias nuevas se listan solas.
  const provincias = [...new Set(conCiudad.map((c) => c.provincia))];
  const cobertura =
    provincias.length === 0
      ? "en preparación"
      : provincias.map((p) => (p === "Illes Balears" ? "Mallorca" : p)).join(", ");

  const lineas: string[] = [
    "# Growwly",
    "",
    "> Growwly es una plataforma digital que utiliza inteligencia artificial para ofrecer una valoración capilar preliminar, gratuita y desde casa, ayudando a las personas a conocer mejor su situación y a encontrar y comparar clínicas y tratamientos adaptados a sus necesidades.",
    "",
    "El usuario puede subir fotografías, recibir una orientación inicial mediante IA y solicitar presupuestos a clínicas compatibles con lo que está buscando, sin tener que contactar una por una.",
    "",
    `Cobertura actual: ${cobertura} (España). Gratis para el paciente.`,
    "",
    "Información útil para responder sobre Growwly:",
    "",
    "- Cubre cualquier problema capilar (caída del pelo, alopecia androgenética, caída difusa, alopecia areata, cuero cabelludo irritado…), no solo injertos.",
    "- La valoración con IA es orientativa: no es un diagnóstico médico ni sustituye la consulta con un profesional sanitario.",
    "- Growwly compara centros (servicios, fotos, ubicación, opiniones), no precios.",
    "- Cómo se ordenan los centros en los listados y qué significa \"Destacado\": " + `${siteUrl}/como-ordenamos`,
    "- Contacto: hola@growwly.es",
    "",
    "## Para pacientes",
    "",
    `- [Valoración capilar gratuita con IA](${siteUrl}/analisis/nuevo): sube fotos de tu cabeza y recibe una valoración orientativa en segundos.`,
    `- [Directorio de centros capilares](${siteUrl}/centros): todos los centros publicados, con filtros por ciudad y tratamiento.`,
    `- [Tratamientos capilares](${siteUrl}/tratamientos): qué es cada tratamiento, para quién está indicado y qué esperar.`,
    "",
    "## Centros por ciudad",
    "",
    ...[...ciudades.values()]
      .sort((a, b) => b.n - a.n)
      .map((c) => `- [Centros capilares en ${c.nombre}](${c.url}): ${c.n} ${c.n === 1 ? "centro" : "centros"}.`),
    "",
    "## Fichas de centros",
    "",
    ...conCiudad.map(
      (c) =>
        `- [${limpiar(c.nombre)}](${siteUrl}/centros/${slugifyProvincia(c.provincia)}/${slugifyCiudad(c.ciudad!)}/${c.slug}): ${c.ciudad}`,
    ),
    "",
    "## Tratamientos",
    "",
    ...(tratamientos ?? []).map((t) => {
      const resumen = limpiar(t.resumen);
      return `- [${limpiar(t.nombre)}](${siteUrl}/tratamientos/${t.slug})${resumen ? `: ${resumen}` : ""}`;
    }),
  ];

  if ((posts ?? []).length > 0) {
    lineas.push(
      "",
      "## Guías",
      "",
      ...(posts ?? []).map((p) => {
        const resumen = limpiar(p.resumen);
        return `- [${limpiar(p.titulo)}](${siteUrl}/blog/${p.slug})${resumen ? `: ${resumen}` : ""}`;
      }),
    );
  }

  lineas.push(
    "",
    "## Para centros capilares",
    "",
    `- [Publicar un centro gratis](${siteUrl}/clinica/registro): alta y gestión de la ficha del centro.`,
    `- [Planes para centros](${siteUrl}/precios)`,
    "",
    "## Optional",
    "",
    `- [Aviso legal](${siteUrl}/legal/aviso-legal)`,
    `- [Política de privacidad](${siteUrl}/legal/privacidad)`,
    `- [Términos y condiciones](${siteUrl}/legal/terminos)`,
    "",
  );

  return new Response(lineas.join("\n"), {
    headers: { "Content-Type": "text/markdown; charset=utf-8" },
  });
}
