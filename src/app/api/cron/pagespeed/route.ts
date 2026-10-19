import { NextResponse } from "next/server";
import { cronAutorizado } from "@/lib/cron/autorizado";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/lib/supabase/database.types";

// Cada análisis de PageSpeed tarda 15–40 s; van en paralelo.
export const maxDuration = 300;

/**
 * Medición semanal de velocidad de las páginas clave (auditoría CRO,
 * tarea 17): PageSpeed Insights en móvil y escritorio, guardado en
 * `pagespeed_mediciones` para ver la evolución y detectar empeoramientos.
 * Necesita PAGESPEED_API_KEY (Google Cloud, restringida a la API de
 * PageSpeed). Se puede lanzar a mano desde Vercel → Settings → Cron Jobs.
 */
const PAGINAS = [
  "/",
  "/analisis/nuevo",
  "/centros/illes-balears/palma",
  "/centros/illes-balears/palma/medical-hair-mallorca",
  "/tratamientos/injerto-capilar-fue",
];
const ESTRATEGIAS = ["mobile", "desktop"] as const;

type Auditoria = {
  title?: string;
  displayValue?: string;
  numericValue?: number;
  details?: { type?: string; overallSavingsMs?: number; items?: { node?: { snippet?: string } }[] };
};
type RespuestaPsi = {
  error?: { message?: string };
  loadingExperience?: { metrics?: Record<string, { percentile?: number; category?: string }> };
  lighthouseResult?: {
    categories?: { performance?: { score?: number | null } };
    audits?: Record<string, Auditoria>;
  };
};

const ms = (a?: Auditoria) => (a?.numericValue != null ? Math.round(a.numericValue) : null);

async function medir(url: string, estrategia: (typeof ESTRATEGIAS)[number], clave: string) {
  const api = new URL("https://www.googleapis.com/pagespeedonline/v5/runPagespeed");
  api.searchParams.set("url", url);
  api.searchParams.set("strategy", estrategia);
  api.searchParams.set("category", "performance");
  api.searchParams.set("locale", "es");
  api.searchParams.set("key", clave);

  try {
    const r = await fetch(api, { cache: "no-store" });
    const j = (await r.json()) as RespuestaPsi;
    if (!r.ok || j.error) {
      return { url, estrategia, error: j.error?.message ?? `HTTP ${r.status}` };
    }
    const a = j.lighthouseResult?.audits ?? {};
    const score = j.lighthouseResult?.categories?.performance?.score;
    const oportunidades = Object.values(a)
      .filter((x) => (x.details?.overallSavingsMs ?? 0) >= 150)
      .sort((x, y) => (y.details?.overallSavingsMs ?? 0) - (x.details?.overallSavingsMs ?? 0))
      .slice(0, 6)
      .map((x) => ({ titulo: x.title, ahorro_ms: Math.round(x.details?.overallSavingsMs ?? 0), valor: x.displayValue ?? null }));
    const campo = j.loadingExperience?.metrics
      ? Object.fromEntries(
          Object.entries(j.loadingExperience.metrics).map(([k, v]) => [k, { p75: v.percentile ?? null, categoria: v.category ?? null }]),
        )
      : null;

    return {
      url,
      estrategia,
      puntuacion: score != null ? Math.round(score * 100) : null,
      fcp_ms: ms(a["first-contentful-paint"]),
      lcp_ms: ms(a["largest-contentful-paint"]),
      tbt_ms: ms(a["total-blocking-time"]),
      cls: a["cumulative-layout-shift"]?.numericValue ?? null,
      speed_index_ms: ms(a["speed-index"]),
      lcp_elemento: a["largest-contentful-paint-element"]?.details?.items?.[0]?.node?.snippet?.slice(0, 500) ?? null,
      campo: campo as Json,
      oportunidades: oportunidades as Json,
    };
  } catch (e) {
    return { url, estrategia, error: e instanceof Error ? e.message : "Error desconocido" };
  }
}

export async function GET(request: Request) {
  if (!cronAutorizado(request)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const clave = process.env.PAGESPEED_API_KEY;
  if (!clave) {
    return NextResponse.json({ error: "Falta PAGESPEED_API_KEY" }, { status: 500 });
  }

  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.growwly.es";
  const filas = await Promise.all(
    PAGINAS.flatMap((p) => ESTRATEGIAS.map((e) => medir(`${base}${p}`, e, clave))),
  );

  const supabase = createAdminClient();
  const { error } = await supabase.from("pagespeed_mediciones").insert(filas);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    resumen: filas.map((f) => ({
      url: f.url,
      estrategia: f.estrategia,
      puntuacion: "puntuacion" in f ? f.puntuacion : null,
      error: "error" in f ? f.error : null,
    })),
  });
}
