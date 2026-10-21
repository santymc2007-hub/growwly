import Link from "next/link";
import { headers } from "next/headers";
import { requireAdmin } from "@/lib/auth/require-admin";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Revisión SEO: recorre todas las URLs del sitemap y lee lo que de
 * verdad sirve cada página (title, meta description, H1, canonical).
 * No recalcula nada por su cuenta: si aquí sale bien, es lo que ve Google.
 */

type Fila = {
  url: string;
  ruta: string;
  tipo: string;
  status: number;
  title: string;
  description: string;
  h1: string;
  canonical: string;
  avisos: string[];
};

const LIMITE_TITLE = 60;
const LIMITE_DESC = 160;
const MIN_DESC = 70;

function extraer(html: string, re: RegExp): string {
  const m = html.match(re);
  return m ? decodificar(m[1].replace(/<[^>]+>/g, "").trim()) : "";
}

function decodificar(t: string): string {
  return t
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function tipoDe(ruta: string): string {
  const partes = ruta.split("/").filter(Boolean);
  if (partes[0] === "centros") return ["Listado", "Provincia", "Ciudad", "Ficha"][partes.length - 1] ?? "Centros";
  if (partes[0] === "tratamientos")
    return ["Tratamientos", "Tratamiento", "Landing provincia", "Landing ciudad"][partes.length - 1] ?? "Tratamientos";
  if (partes[0] === "blog") return partes.length > 1 ? "Post" : "Blog";
  return partes.length === 0 ? "Home" : "Otra";
}

async function revisar(url: string, origen: string): Promise<Fila> {
  const ruta = new URL(url).pathname || "/";
  // Se pide al propio despliegue (origen actual), no al dominio del
  // sitemap: así también funciona en previews.
  const res = await fetch(`${origen}${ruta}`, { cache: "no-store" }).catch(() => null);
  const html = res ? await res.text() : "";
  const title = extraer(html, /<title[^>]*>([\s\S]*?)<\/title>/i);
  const description = extraer(html, /<meta[^>]+name="description"[^>]+content="([^"]*)"/i);
  const h1 = extraer(html, /<h1[^>]*>([\s\S]*?)<\/h1>/i);
  const canonical = extraer(html, /<link[^>]+rel="canonical"[^>]+href="([^"]*)"/i);

  const avisos: string[] = [];
  if (!res || res.status !== 200) avisos.push(`HTTP ${res?.status ?? "error"}`);
  if (!title) avisos.push("Sin title");
  else if (title.length > LIMITE_TITLE) avisos.push(`Title largo (${title.length})`);
  if (!description) avisos.push("Sin meta");
  else if (description.length > LIMITE_DESC) avisos.push(`Meta larga (${description.length})`);
  else if (description.length < MIN_DESC) avisos.push(`Meta corta (${description.length})`);
  if (!h1) avisos.push("Sin H1");
  if (canonical && new URL(canonical).pathname.replace(/\/$/, "") !== ruta.replace(/\/$/, ""))
    avisos.push("Canonical distinta");

  return { url, ruta, tipo: tipoDe(ruta), status: res?.status ?? 0, title, description, h1, canonical, avisos };
}

/** Procesa en tandas para no lanzar 100 peticiones a la vez. */
async function enTandas<T, R>(items: T[], n: number, fn: (x: T) => Promise<R>): Promise<R[]> {
  const out: R[] = [];
  for (let i = 0; i < items.length; i += n) out.push(...(await Promise.all(items.slice(i, i + n).map(fn))));
  return out;
}

export default async function SeoPage({
  searchParams,
}: {
  searchParams: Promise<{ solo?: string; tipo?: string }>;
}) {
  await requireAdmin();
  const { solo, tipo } = await searchParams;

  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "https";
  const origen = `${proto}://${host}`;

  const sitemap = await fetch(`${origen}/sitemap.xml`, { cache: "no-store" })
    .then((r) => r.text())
    .catch(() => "");
  const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);

  const filas = await enTandas(urls, 8, (u) => revisar(u, origen));

  // Duplicados entre páginas distintas.
  const contar = (campo: "title" | "description") => {
    const c = new Map<string, number>();
    for (const f of filas) if (f[campo]) c.set(f[campo], (c.get(f[campo]) ?? 0) + 1);
    return c;
  };
  const titles = contar("title");
  const descs = contar("description");
  for (const f of filas) {
    if ((titles.get(f.title) ?? 0) > 1) f.avisos.push("Title duplicado");
    if ((descs.get(f.description) ?? 0) > 1) f.avisos.push("Meta duplicada");
  }

  const tipos = [...new Set(filas.map((f) => f.tipo))];
  const visibles = filas.filter(
    (f) => (solo !== "avisos" || f.avisos.length > 0) && (!tipo || f.tipo === tipo),
  );
  const conAvisos = filas.filter((f) => f.avisos.length > 0).length;

  const enlace = (q: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries(q)) if (v) p.set(k, v);
    const s = p.toString();
    return s ? `/admin/seo?${s}` : "/admin/seo";
  };

  return (
    <div>
      <h1 className="font-display text-2xl text-teal-dark">Revisión SEO</h1>
      <p className="mt-1 max-w-3xl text-sm text-ink-soft">
        Todas las páginas del sitemap ({filas.length}) con el title, la meta description y el H1
        que sirven ahora mismo. Límites orientativos: title ≤ {LIMITE_TITLE} caracteres (incluye
        &quot;| Growwly&quot;), meta entre {MIN_DESC} y {LIMITE_DESC}. {conAvisos} con avisos.
      </p>

      <div className="mt-4 flex flex-wrap gap-2 text-sm">
        <Link
          href={enlace({ tipo })}
          className={`rounded-full px-3 py-1 ${solo !== "avisos" ? "bg-teal-dark text-white" : "border border-line bg-white"}`}
        >
          Todas
        </Link>
        <Link
          href={enlace({ solo: "avisos", tipo })}
          className={`rounded-full px-3 py-1 ${solo === "avisos" ? "bg-teal-dark text-white" : "border border-line bg-white"}`}
        >
          Solo con avisos ({conAvisos})
        </Link>
        <span className="mx-2 text-line">|</span>
        <Link
          href={enlace({ solo })}
          className={`rounded-full px-3 py-1 ${!tipo ? "bg-sage text-sage-ink" : "border border-line bg-white"}`}
        >
          Todos los tipos
        </Link>
        {tipos.map((t) => (
          <Link
            key={t}
            href={enlace({ solo, tipo: t })}
            className={`rounded-full px-3 py-1 ${tipo === t ? "bg-sage text-sage-ink" : "border border-line bg-white"}`}
          >
            {t} ({filas.filter((f) => f.tipo === t).length})
          </Link>
        ))}
      </div>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-line bg-white">
        <table className="w-full min-w-[1000px] text-left text-sm">
          <thead className="bg-paper-dim text-xs uppercase text-ink-soft">
            <tr>
              <th className="p-3">Página</th>
              <th className="p-3">Title</th>
              <th className="p-3">Meta description</th>
              <th className="p-3">H1</th>
              <th className="p-3">Avisos</th>
            </tr>
          </thead>
          <tbody>
            {visibles.map((f) => (
              <tr key={f.url} className="border-t border-line align-top">
                <td className="p-3">
                  <span className="text-xs text-ink-soft">{f.tipo}</span>
                  <a href={f.ruta} target="_blank" rel="noreferrer" className="block break-all text-cyan hover:underline">
                    {f.ruta}
                  </a>
                </td>
                <td className="p-3">
                  {f.title}
                  <span className={`ml-1 text-xs ${f.title.length > LIMITE_TITLE ? "text-orange" : "text-ink-soft"}`}>
                    ({f.title.length})
                  </span>
                </td>
                <td className="p-3">
                  {f.description}
                  <span
                    className={`ml-1 text-xs ${
                      f.description.length > LIMITE_DESC || f.description.length < MIN_DESC ? "text-orange" : "text-ink-soft"
                    }`}
                  >
                    ({f.description.length})
                  </span>
                </td>
                <td className="p-3">{f.h1}</td>
                <td className="p-3">
                  {f.avisos.length === 0 ? (
                    <span className="text-green">OK</span>
                  ) : (
                    <ul className="flex flex-col gap-1">
                      {f.avisos.map((a) => (
                        <li key={a} className="rounded bg-orange/15 px-2 py-0.5 text-xs text-ink">
                          {a}
                        </li>
                      ))}
                    </ul>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
