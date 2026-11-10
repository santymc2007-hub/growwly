import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { canalDeAtribucion, sanearAtribucion } from "@/lib/analytics/atribucion";
import { ETIQUETA_PASO, PASOS_CON_ORIGEN_URL, type PasoEmbudo } from "@/lib/analytics/embudo-pasos";

export const dynamic = "force-dynamic";

type SearchParams = { rango?: string };

const RANGOS = [
  { valor: "1", label: "Hoy" },
  { valor: "7", label: "7 días" },
  { valor: "30", label: "30 días" },
  { valor: "90", label: "90 días" },
] as const;

const PASOS_VALORACION: PasoEmbudo[] = [
  "val_formulario",
  "val_camara",
  "val_fotos",
  "val_enviada",
  "val_rechazada",
  "val_lista",
  "val_error",
  "val_resultado_visto",
  "val_email",
  "val_cuenta",
];
const PASOS_SOLICITUD: PasoEmbudo[] = ["sol_inicio", "sol_enviada", "sol_error"];
const PASOS_CITA: PasoEmbudo[] = ["cita_formulario", "cita_enviada", "cita_error"];
const PASOS_CON_MOTIVO: PasoEmbudo[] = ["val_rechazada", "val_error", "sol_error", "cita_error"];

const CANAL_LABEL: Record<string, string> = {
  google_ads: "Google Ads",
  meta_ads: "Meta Ads",
  meta_fbclid: "Facebook/Instagram (enlace)",
  google_organico: "Google orgánico",
  meta_organico: "Instagram/Facebook orgánico",
  buscador_otro: "Otros buscadores",
  ia: "Asistentes IA",
  directo: "Directo",
  sin_consentimiento: "Sin consentimiento",
  sin_dato: "Sin dato",
  sin_campana: "Sin campaña en la URL",
};

function etiquetaCanal(canal: string) {
  return CANAL_LABEL[canal] ?? canal.replace(/^referral:/, "").replace(/^campana:/, "campaña: ");
}

function contar<T>(lista: T[], clave: (x: T) => string) {
  const mapa = new Map<string, number>();
  for (const x of lista) mapa.set(clave(x), (mapa.get(clave(x)) ?? 0) + 1);
  return mapa;
}

function pct(parte: number, total: number) {
  if (!total) return "—";
  return `${Math.round((parte / total) * 100)} %`;
}

function selectorRango(rango: string) {
  return (
    <div className="inline-flex rounded-full border border-line bg-white p-1">
      {RANGOS.map((r) => (
        <Link
          key={r.valor}
          href={`?rango=${r.valor}`}
          className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
            rango === r.valor ? "bg-teal-dark text-white" : "text-ink-soft hover:text-teal-dark"
          }`}
        >
          {r.label}
        </Link>
      ))}
    </div>
  );
}

function Seccion({ titulo, nota, children }: { titulo: string; nota?: string; children: React.ReactNode }) {
  return (
    <section className="mt-6 rounded-2xl border border-line bg-white p-5">
      <h2 className="font-display text-lg text-teal-dark">{titulo}</h2>
      {nota && <p className="mt-1 text-sm text-ink-soft">{nota}</p>}
      <div className="mt-4 overflow-x-auto">{children}</div>
    </section>
  );
}

/** Tabla pasos × canales: cuántas veces y % sobre el primer paso de la fila de arriba. */
function TablaEmbudo({
  pasos,
  canales,
  porPasoYCanal,
  base,
}: {
  pasos: PasoEmbudo[];
  canales: string[];
  porPasoYCanal: Map<string, number>;
  base: PasoEmbudo;
}) {
  const valor = (paso: string, canal: string | null) =>
    canal === null
      ? canales.reduce((s, c) => s + (porPasoYCanal.get(`${paso}|${c}`) ?? 0), 0)
      : porPasoYCanal.get(`${paso}|${canal}`) ?? 0;
  return (
    <table className="w-full min-w-[640px] text-sm">
      <thead>
        <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-ink-soft">
          <th className="py-2 pr-4 font-medium">Paso</th>
          <th className="py-2 pr-4 text-right font-medium">Total</th>
          {canales.map((c) => (
            <th key={c} className="py-2 pr-4 text-right font-medium">
              {etiquetaCanal(c)}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {pasos.map((paso) => {
          const total = valor(paso, null);
          const totalBase = valor(base, null);
          return (
            <tr key={paso} className="border-b border-line/60 last:border-0">
              <td className="py-2 pr-4 text-ink">{ETIQUETA_PASO[paso]}</td>
              <td className="py-2 pr-4 text-right font-semibold text-teal-dark">
                {total}
                {paso !== base && <span className="ml-1.5 text-xs font-normal text-ink-soft">{pct(total, totalBase)}</span>}
              </td>
              {canales.map((c) => {
                const v = valor(paso, c);
                return (
                  <td key={c} className="py-2 pr-4 text-right text-ink">
                    {v || <span className="text-ink-soft">·</span>}
                    {v > 0 && paso !== base && (
                      <span className="ml-1.5 text-xs text-ink-soft">{pct(v, valor(base, c))}</span>
                    )}
                  </td>
                );
              })}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

/** 00:00 (hora de Madrid) del primer día del rango, en ISO. */
function inicioRangoMadrid(dias: number): string {
  const ahora = new Date();
  const hoyMadrid = new Date(ahora.toLocaleString("en-US", { timeZone: "Europe/Madrid" }));
  const desdeMadrid = new Date(hoyMadrid);
  desdeMadrid.setHours(0, 0, 0, 0);
  desdeMadrid.setDate(desdeMadrid.getDate() - (dias - 1));
  const desfase = hoyMadrid.getTime() - ahora.getTime();
  return new Date(desdeMadrid.getTime() - desfase).toISOString();
}

export default async function EmbudoAdminPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const { rango: rangoParam } = await searchParams;
  const rango = RANGOS.some((r) => r.valor === rangoParam) ? rangoParam! : "7";
  const dias = Number(rango);

  const desde = inicioRangoMadrid(dias);

  const admin = createAdminClient();
  const [eventos, estudios, solicitudes, citas, contactos] = await Promise.all([
    admin.from("embudo_eventos").select("paso, canal, campana, detalle").gte("created_at", desde).limit(50000),
    admin.from("estudios_capilares").select("estado, atribucion").gte("created_at", desde).limit(20000),
    admin.from("solicitudes_presupuesto").select("atribucion").gte("created_at", desde).limit(20000),
    admin.from("solicitudes_cita_directa").select("atribucion").gte("creado_en", desde).limit(20000),
    admin
      .from("clinic_contact_clicks")
      .select("metodo, atribucion")
      .gte("created_at", desde)
      .neq("metodo", "ver_mapa")
      .limit(50000),
  ]);

  const filas = eventos.data ?? [];

  // Llegadas desde anuncios: por canal y por anuncio (utm_content va al
  // principio del detalle, antes de " · ruta").
  const llegadas = filas.filter((e) => e.paso === "llegada_anuncio");
  const llegadasPorAnuncio = [
    ...contar(llegadas, (e) => `${e.canal}|${e.campana ?? "—"}|${(e.detalle ?? "-").split(" · ")[0]}`).entries(),
  ].sort((a, b) => b[1] - a[1]);
  const decisiones = filas.filter((e) => e.paso === "cookies_decision");
  const canalesDecision = [...contar(decisiones, (e) => e.canal).entries()].sort((a, b) => b[1] - a[1]).map(([c]) => c);
  const decisionPorCanal = contar(decisiones, (e) => `${e.canal}|${e.detalle ?? "?"}`);
  const tiposDecision = [...new Set(decisiones.map((e) => e.detalle ?? "?"))].sort();
  const porPasoYCanal = contar(filas, (e) => `${e.paso}|${e.canal}`);
  // Las columnas de los embudos salen de sus propios pasos (las llegadas y
  // el banner tienen su sección y otro modo de saber el canal).
  const totalPorCanal = contar(
    filas.filter((e) => !PASOS_CON_ORIGEN_URL.includes(e.paso as PasoEmbudo)),
    (e) => e.canal,
  );
  const canales = [...totalPorCanal.entries()].sort((a, b) => b[1] - a[1]).map(([c]) => c).slice(0, 8);

  const motivos = PASOS_CON_MOTIVO.map((paso) => ({
    paso,
    lista: [...contar(filas.filter((e) => e.paso === paso), (e) => e.detalle ?? "sin detalle").entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8),
  })).filter((m) => m.lista.length > 0);

  const pasosAsistente = [...contar(filas.filter((e) => e.paso === "sol_paso"), (e) => e.detalle ?? "?").entries()].sort(
    (a, b) => parseInt(a[0]) - parseInt(b[0]),
  );

  const canalDe = (a: unknown) => {
    const limpio = sanearAtribucion(a);
    return limpio ? canalDeAtribucion(limpio) : "sin_dato";
  };
  const resultados = [
    { nombre: "Valoraciones generadas", porCanal: contar((estudios.data ?? []).filter((e) => e.estado === "listo"), (e) => canalDe(e.atribucion)) },
    { nombre: "Solicitudes de presupuesto", porCanal: contar(solicitudes.data ?? [], (s) => canalDe(s.atribucion)) },
    { nombre: "«Pedir cita» en fichas", porCanal: contar(citas.data ?? [], (s) => canalDe(s.atribucion)) },
    { nombre: "Clics de contacto en fichas", porCanal: contar(contactos.data ?? [], (s) => canalDe(s.atribucion)) },
  ];
  const canalesResultados = [
    ...new Set(resultados.flatMap((r) => [...r.porCanal.keys()])),
  ].sort((a, b) => (a === "sin_dato" ? 1 : b === "sin_dato" ? -1 : a.localeCompare(b)));

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl text-teal-dark">Embudo y origen</h1>
          <p className="mt-1 max-w-2xl text-sm text-ink-soft">
            Por dónde llegan los usuarios, hasta qué paso avanzan y por qué se quedan. Se cuenta aunque no acepten
            las cookies; el canal solo se sabe si aceptan la publicidad (si no, «Sin consentimiento»).
          </p>
        </div>
        {selectorRango(rango)}
      </div>

      {filas.length === 0 && (
        <p className="mt-6 rounded-2xl border border-line bg-white p-5 text-sm text-ink-soft">
          Todavía no hay pasos registrados en este periodo.
        </p>
      )}

      {filas.length > 0 && (
        <>
          <Seccion
            titulo="Llegadas desde anuncios"
            nota="Visitas en las que la web llegó a cargar con parámetros de campaña en la URL (no necesita cookies). Compáralo con los clics y las «visitas a la página de destino» que dicen Meta y Google Ads: la diferencia son clics que se pierden antes de que cargue la página."
          >
            {llegadas.length === 0 ? (
              <p className="text-sm text-ink-soft">Ninguna en este periodo.</p>
            ) : (
              <table className="w-full min-w-[560px] text-sm">
                <thead>
                  <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-ink-soft">
                    <th className="py-2 pr-4 font-medium">Canal</th>
                    <th className="py-2 pr-4 font-medium">Campaña</th>
                    <th className="py-2 pr-4 font-medium">Anuncio (utm_content)</th>
                    <th className="py-2 pr-4 text-right font-medium">Llegadas</th>
                  </tr>
                </thead>
                <tbody>
                  {llegadasPorAnuncio.map(([clave, n]) => {
                    const [canal, campana, anuncio] = clave.split("|");
                    return (
                      <tr key={clave} className="border-b border-line/60 last:border-0">
                        <td className="py-2 pr-4 text-ink">{etiquetaCanal(canal)}</td>
                        <td className="py-2 pr-4 text-ink-soft">{campana}</td>
                        <td className="py-2 pr-4 text-ink-soft">{anuncio}</td>
                        <td className="py-2 pr-4 text-right font-semibold text-teal-dark">{n}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </Seccion>

          <Seccion
            titulo="Banner de cookies"
            nota="Qué eligen, según el canal de la página donde deciden. Quien rechaza la analítica no aparece en Google Analytics."
          >
            {decisiones.length === 0 ? (
              <p className="text-sm text-ink-soft">Nadie ha decidido todavía en este periodo.</p>
            ) : (
              <table className="w-full min-w-[560px] text-sm">
                <thead>
                  <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-ink-soft">
                    <th className="py-2 pr-4 font-medium">Elección</th>
                    {canalesDecision.map((c) => (
                      <th key={c} className="py-2 pr-4 text-right font-medium">
                        {etiquetaCanal(c)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tiposDecision.map((tipo) => (
                    <tr key={tipo} className="border-b border-line/60 last:border-0">
                      <td className="py-2 pr-4 text-ink">{tipo}</td>
                      {canalesDecision.map((c) => {
                        const v = decisionPorCanal.get(`${c}|${tipo}`) ?? 0;
                        const total = [...decisionPorCanal.entries()]
                          .filter(([k]) => k.startsWith(`${c}|`))
                          .reduce((s, [, x]) => s + x, 0);
                        return (
                          <td key={c} className="py-2 pr-4 text-right text-ink">
                            {v || <span className="text-ink-soft">·</span>}
                            {v > 0 && <span className="ml-1.5 text-xs text-ink-soft">{pct(v, total)}</span>}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Seccion>

          <Seccion
            titulo="Valoración capilar"
            nota="Porcentaje sobre «Entra en la valoración» de la misma columna. Las pruebas de Santy también cuentan aquí."
          >
            <TablaEmbudo pasos={PASOS_VALORACION} canales={canales} porPasoYCanal={porPasoYCanal} base="val_formulario" />
          </Seccion>

          <Seccion titulo="Solicitud de presupuesto (asistente)">
            <TablaEmbudo pasos={PASOS_SOLICITUD} canales={canales} porPasoYCanal={porPasoYCanal} base="sol_inicio" />
            {pasosAsistente.length > 0 && (
              <div className="mt-4">
                <p className="text-xs font-medium uppercase tracking-wide text-ink-soft">Pasos completados del asistente</p>
                <ul className="mt-2 grid gap-1 text-sm sm:grid-cols-2">
                  {pasosAsistente.map(([paso, n]) => (
                    <li key={paso} className="flex justify-between gap-4 border-b border-line/60 py-1">
                      <span>Paso {paso}</span>
                      <span className="font-semibold text-teal-dark">{n}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Seccion>

          <Seccion titulo="«Pedir cita» desde la ficha de un centro">
            <TablaEmbudo pasos={PASOS_CITA} canales={canales} porPasoYCanal={porPasoYCanal} base="cita_formulario" />
          </Seccion>

          {motivos.length > 0 && (
            <Seccion titulo="Por qué se quedan" nota="Errores y rechazos que han visto los usuarios.">
              <div className="grid gap-5 md:grid-cols-2">
                {motivos.map((m) => (
                  <div key={m.paso}>
                    <p className="text-sm font-semibold text-ink">{ETIQUETA_PASO[m.paso]}</p>
                    <ul className="mt-2 space-y-1 text-sm">
                      {m.lista.map(([detalle, n]) => (
                        <li key={detalle} className="flex justify-between gap-4 border-b border-line/60 py-1">
                          <span className="text-ink-soft">{detalle}</span>
                          <span className="font-semibold text-teal-dark">{n}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </Seccion>
          )}
        </>
      )}

      <Seccion
        titulo="Resultados por canal (base de datos)"
        nota="Lo que de verdad ha entrado, según el origen guardado en cada registro. «Sin dato»: no aceptó la publicidad, entró directo o es anterior a esta medición."
      >
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-ink-soft">
              <th className="py-2 pr-4 font-medium">Resultado</th>
              <th className="py-2 pr-4 text-right font-medium">Total</th>
              {canalesResultados.map((c) => (
                <th key={c} className="py-2 pr-4 text-right font-medium">
                  {etiquetaCanal(c)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {resultados.map((r) => (
              <tr key={r.nombre} className="border-b border-line/60 last:border-0">
                <td className="py-2 pr-4 text-ink">{r.nombre}</td>
                <td className="py-2 pr-4 text-right font-semibold text-teal-dark">
                  {[...r.porCanal.values()].reduce((s, n) => s + n, 0)}
                </td>
                {canalesResultados.map((c) => (
                  <td key={c} className="py-2 pr-4 text-right text-ink">
                    {r.porCanal.get(c) ?? <span className="text-ink-soft">·</span>}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </Seccion>
    </div>
  );
}
