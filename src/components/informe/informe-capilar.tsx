import Link from "next/link";
import { ArrowRight, ClipboardCheck, Droplet, Lock, Plus, ScanFace, Stethoscope } from "lucide-react";
import { MapaCabeza, COLOR_INTENSIDAD } from "./mapa-cabeza";
import { FotosEstudio } from "./fotos-estudio";
import type { ContenidoFlujo, Tono } from "@/lib/informe/flujos";
import type { Fiabilidad } from "@/lib/informe/fiabilidad";
import type { AnguloFoto, CalidadFoto, InformeCapilar } from "@/lib/informe/tipos";

export type FotoConUrl = { url: string | null; angulo: AnguloFoto; calidad: CalidadFoto };

const COLOR_TONO: Record<Tono, string> = {
  ok: "text-sage-ink",
  aviso: "text-[#8a5a00]",
  neutro: "text-teal-dark",
};

const COLOR_NIVEL = { Baja: "#f08a24", Media: "#ffba1f", Alta: "#96ceb7" } as const;
const NIVELES = ["Baja", "Media", "Alta"] as const;

function Etiqueta({ children, azul }: { children: React.ReactNode; azul?: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-2 self-start rounded-full px-3.5 py-1.5 text-[13px] font-semibold uppercase tracking-wider ${
        azul ? "bg-[#dcf0fa] text-teal-dark" : "bg-sage text-sage-ink"
      }`}
    >
      {children}
    </span>
  );
}

/**
 * Informe capilar orientativo. Misma plantilla para los 7 flujos: a la
 * izquierda la valoración (qué vemos y qué te recomendamos), a la
 * derecha lo que depende de las fotos (fiabilidad y fotos revisadas).
 */
export function InformeCapilarVista({
  estudioId,
  fecha,
  nombre,
  informe,
  contenido,
  fiabilidad,
  fotos,
  vistaClinica,
}: {
  estudioId: string;
  fecha: string;
  nombre: string | null;
  informe: InformeCapilar;
  contenido: ContenidoFlujo;
  fiabilidad: Fiabilidad;
  fotos: FotoConUrl[];
  /** La clínica ve el informe tal cual lo vio el paciente, sin llamadas a la acción ni edición de fotos. */
  vistaClinica?: { volverHref: string };
}) {
  const esClinica = Boolean(vistaClinica);
  const hrefPresupuesto = `/cuenta/solicitud/nueva?estudio=${estudioId}`;
  const metrica = contenido.rec.metrica(informe);
  const tiles = contenido.rec.tiles(informe);
  const tratamientos = contenido.tratamientos(informe);
  const niveles = contenido.escala.niveles;
  const idxNivel = NIVELES.indexOf(fiabilidad.nivel);

  return (
    <div className="overflow-hidden rounded-3xl bg-white shadow-sm">
      {/* Barra superior */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-6 py-5 sm:px-10">
        <Link
          href={vistaClinica?.volverHref ?? "/cuenta#analisis"}
          className="text-sm font-medium text-teal hover:text-teal-dark"
        >
          {esClinica ? "← Volver a la solicitud" : "← Volver a mi cuenta"}
        </Link>
        <span className="text-sm text-ink-soft">
          {esClinica ? "Valoración que vio el paciente" : "Informe orientativo"} · {fecha}
        </span>
      </div>

      <div className="grid items-start gap-10 px-6 py-8 sm:px-10 sm:py-10 lg:grid-cols-[minmax(0,1fr)_400px]">
        {/* ===== IZQUIERDA · VALORACIÓN ===== */}
        <div className="flex min-w-0 flex-col gap-7">
          <Etiqueta>
            <ClipboardCheck className="h-4 w-4" aria-hidden /> Tu valoración
          </Etiqueta>

          <div className="flex flex-col gap-3.5">
            <h1 className="font-display text-3xl font-extrabold leading-tight tracking-tight text-teal-dark sm:text-[44px] sm:leading-[1.1]">
              {contenido.titulo(nombre)}
            </h1>
            <p className="text-lg leading-relaxed text-ink-soft">{contenido.intro}</p>
          </div>

          {/* Escala del flujo */}
          <section className="flex flex-col gap-4 rounded-3xl bg-paper-dim px-6 py-6 sm:px-8 sm:py-7">
            <p className="font-display text-xl font-bold text-teal-dark">
              {contenido.escala.nombre}{" "}
              <span className="font-sans text-sm font-medium text-ink-soft">· {contenido.escala.sub}</span>
            </p>
            <div
              className="grid gap-2"
              style={{ gridTemplateColumns: `repeat(${niveles.length}, minmax(0, 1fr))` }}
            >
              {niveles.map((n) => {
                const activo = n === informe.grado;
                return (
                  <div
                    key={n}
                    aria-current={activo ? "true" : undefined}
                    className={`flex h-14 items-center justify-center rounded-2xl border px-2 text-center font-display text-base font-extrabold sm:h-[60px] sm:text-lg ${
                      activo ? "border-teal-dark bg-teal-dark text-white" : "border-line bg-white text-ink-soft"
                    }`}
                  >
                    {n}
                  </div>
                );
              })}
            </div>
            <p className="text-base text-ink">
              <strong className="font-semibold text-teal-dark">{contenido.escala.resultado(informe)}</strong>
              {informe.detalle && <> · {informe.detalle}</>}
            </p>
          </section>

          {/* Qué significa + mapa */}
          <section className="flex flex-col gap-6 rounded-3xl border border-line p-6 sm:p-8">
            <h2 className="font-display text-3xl font-extrabold text-teal-dark">Qué significa</h2>
            <div className="grid items-start gap-8 md:grid-cols-[290px_minmax(0,1fr)]">
              <MapaCabeza informe={informe} mostrarDonante={contenido.mostrarDonante} />
              <div className="flex flex-col gap-4">
                {contenido.significa.map((p) => (
                  <p key={p.slice(0, 20)} className="text-[17px] leading-relaxed text-ink">
                    {p}
                  </p>
                ))}
                {informe.observaciones.length > 0 && (
                  <div className="flex flex-col gap-3 border-t border-line pt-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-ink-soft">
                      Lo que vemos en tus fotos
                    </p>
                    <ul className="flex flex-col gap-3">
                      {informe.observaciones.map((o) => (
                        <li key={o.texto} className="flex gap-3 text-base leading-snug">
                          <span
                            className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full"
                            style={{
                              background:
                                o.tono === "donante"
                                  ? "#61c5f1"
                                  : o.tono === "conservada"
                                    ? "#96ceb7"
                                    : COLOR_INTENSIDAD[o.tono],
                            }}
                          />
                          {o.texto}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Posibles tratamientos */}
          <section className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <h2 className="font-display text-3xl font-extrabold text-teal-dark">{contenido.tratTitulo}</h2>
              <p className="text-base text-ink-soft">
                Son las opciones habituales para casos como el tuyo. Cuál te conviene lo decide un médico en consulta.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {tratamientos.map((t) => (
                <article
                  key={t.nombre}
                  className={`flex flex-col gap-3.5 rounded-[20px] bg-white p-6 ${
                    t.top ? "border-2 border-yellow" : "border border-line"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-paper-dim text-teal-dark">
                      <Droplet className="h-6 w-6" aria-hidden />
                    </span>
                    {t.top && (
                      <span className="rounded-full bg-yellow px-3 py-1 text-xs font-bold text-teal-dark">
                        Te lo recomendamos
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-semibold uppercase tracking-wider text-teal">{t.tipo}</span>
                    <h3 className="font-display text-xl font-bold text-teal-dark">{t.nombre}</h3>
                  </div>
                  <p className="text-[15px] leading-relaxed text-ink-soft md:min-h-[70px]">{t.porque}</p>
                  <div className="mt-auto flex justify-between gap-3 border-t border-line pt-3.5 text-sm">
                    <span className="text-ink-soft">Sesiones</span>
                    <span className="text-right font-semibold text-teal-dark">{t.sesiones}</span>
                  </div>
                </article>
              ))}
            </div>
          </section>

          {/* Recomendación + valoración específica del flujo */}
          <section className="flex flex-col gap-5 rounded-3xl bg-paper-dim p-6 sm:p-8">
            <div className="flex flex-col gap-2">
              <span className="self-start rounded-full bg-yellow px-3 py-1 text-xs font-bold text-teal-dark">
                Te lo recomendamos · {contenido.rec.tag(informe)}
              </span>
              <h2 className="font-display text-3xl font-extrabold text-teal-dark">{contenido.rec.titulo}</h2>
              <p className="text-base text-ink-soft">{contenido.rec.sub}</p>
            </div>

            <div className="grid items-center gap-8 rounded-[20px] bg-white p-6 sm:p-7 md:grid-cols-2">
              <div className="flex flex-col gap-1">
                <span className="text-sm font-semibold text-ink-soft">{metrica.label}</span>
                <span className="font-display text-4xl font-extrabold leading-tight tracking-tight text-teal-dark sm:text-5xl">
                  {metrica.valor}
                </span>
                <span className="text-[15px] font-semibold text-teal">{metrica.unidad}</span>
              </div>
              <div className="flex flex-col gap-3">
                {metrica.barra && (
                  <div className="flex flex-col gap-2.5">
                    <div className="relative h-3.5 rounded-full bg-line">
                      <div
                        className="absolute inset-y-0 rounded-full bg-gradient-to-r from-yellow to-orange shadow-[0_0_0_3px_#fff,0_0_0_5px_#ffba1f]"
                        style={{ left: `${metrica.barra.left}%`, width: `${Math.max(2, metrica.barra.width)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-ink-soft">
                      {["0", "1.000", "2.000", "3.000", "4.000", "5.000+"].map((k) => (
                        <span key={k}>{k}</span>
                      ))}
                    </div>
                  </div>
                )}
                {metrica.linea && (
                  <ol
                    className="relative grid gap-2"
                    style={{ gridTemplateColumns: `repeat(${metrica.linea.length}, minmax(0, 1fr))` }}
                  >
                    <span aria-hidden className="absolute left-[12%] right-[12%] top-2.5 h-1 rounded-full bg-line" />
                    {metrica.linea.map((s) => (
                      <li key={s.t} className="relative flex flex-col items-center gap-1.5 text-center">
                        <span
                          aria-hidden
                          className={`h-6 w-6 rounded-full ${
                            s.aqui
                              ? "bg-orange shadow-[0_0_0_4px_#fff,0_0_0_6px_#ffba1f]"
                              : "border-[3px] border-dashed border-brand-green bg-white"
                          }`}
                        />
                        <span className={`text-[13px] font-bold leading-tight ${s.aqui ? "text-[#8a5a00]" : "text-teal-dark"}`}>
                          {s.t}
                        </span>
                        <span className="text-xs text-ink-soft">{s.when}</span>
                      </li>
                    ))}
                  </ol>
                )}
                <p className="text-sm leading-relaxed text-ink-soft">{metrica.nota}</p>
              </div>
            </div>

            <div className={`grid gap-4 ${tiles.length === 3 ? "md:grid-cols-3" : "md:grid-cols-2"}`}>
              {tiles.map((t) => (
                <div key={t.label} className="flex flex-col gap-2.5 rounded-[20px] bg-white p-6">
                  <span className="text-sm font-semibold text-ink-soft">{t.label}</span>
                  <span className={`font-display text-[26px] font-extrabold leading-tight ${COLOR_TONO[t.tono ?? "neutro"]}`}>
                    {t.valor}
                  </span>
                  {t.medidor != null && (
                    <div className="grid grid-cols-4 gap-1.5" aria-hidden>
                      {[1, 2, 3, 4].map((i) => (
                        <span key={i} className={`h-2 rounded-full ${i <= t.medidor! ? "bg-brand-blue" : "bg-line"}`} />
                      ))}
                    </div>
                  )}
                  <span className="text-sm leading-relaxed text-ink-soft">{t.nota}</span>
                </div>
              ))}
            </div>

            {!esClinica && (
            <div className="flex flex-col items-start gap-4 pt-1 sm:flex-row sm:items-center sm:justify-between">
              <p className="font-display text-xl font-bold text-teal-dark">{contenido.rec.pregunta}</p>
              <Link
                href={hrefPresupuesto}
                className="press rounded-full bg-yellow px-7 py-3.5 font-display text-base font-bold text-teal-dark shadow-lg shadow-yellow/30 transition hover:opacity-90"
              >
                {contenido.rec.boton}
              </Link>
            </div>
            )}
          </section>
        </div>

        {/* ===== DERECHA · SOBRE TUS FOTOS ===== */}
        <aside className="flex flex-col gap-5 lg:sticky lg:top-6">
          <Etiqueta azul>
            <ScanFace className="h-4 w-4" aria-hidden /> Sobre tus fotos
          </Etiqueta>

          {/* Fiabilidad */}
          <section className="flex flex-col gap-4 rounded-3xl border border-line p-7">
            <div className="flex items-baseline justify-between">
              <h2 className="font-display text-[22px] font-extrabold text-teal-dark">Nivel de fiabilidad</h2>
              <span className="font-display text-[22px] font-extrabold text-teal-dark">{fiabilidad.nivel}</span>
            </div>
            <div className="flex flex-col gap-1.5">
              <div className="grid grid-cols-3 gap-1.5" aria-hidden>
                {NIVELES.map((n, i) => (
                  <span
                    key={n}
                    className="h-2.5 rounded-full"
                    style={{ background: i <= idxNivel ? COLOR_NIVEL[fiabilidad.nivel] : "#e1e8e6" }}
                  />
                ))}
              </div>
              <div className="grid grid-cols-3 gap-1.5 text-xs text-ink-soft">
                {NIVELES.map((n) => (
                  <span key={n}>{n}</span>
                ))}
              </div>
            </div>
            <dl className="flex flex-col gap-2.5 border-y border-line py-4 text-[15px]">
              <div className="flex justify-between">
                <dt className="text-ink-soft">Zonas que pedimos</dt>
                <dd className={`font-semibold ${fiabilidad.faltan.length ? "text-[#8a5a00]" : "text-sage-ink"}`}>
                  {fiabilidad.cubiertas} de {fiabilidad.totalZonas}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-soft">Fotos que se ven bien</dt>
                <dd className={`font-semibold ${fiabilidad.calidad === "Buena" ? "text-sage-ink" : "text-[#8a5a00]"}`}>
                  {fiabilidad.fotosBuenas} de {fiabilidad.totalFotos}
                </dd>
              </div>
            </dl>
            <p className="text-[15px] leading-relaxed text-ink">{fiabilidad.texto}</p>
            {!esClinica && fiabilidad.faltan.length > 0 && (
              <a
                href="#fotos"
                className="press inline-flex items-center gap-2 self-start rounded-full border-2 border-yellow px-5 py-2.5 text-sm font-semibold text-teal-dark transition hover:bg-yellow/10"
              >
                <Plus className="h-4 w-4" aria-hidden /> Añadir las fotos que faltan
              </a>
            )}
          </section>

          {/* Fotos */}
          <section id="fotos" className="flex scroll-mt-6 flex-col gap-4 rounded-3xl border border-line p-7">
            <div className="flex flex-col gap-1">
              <h2 className="font-display text-[22px] font-extrabold text-teal-dark">
                {esClinica ? "Fotos del paciente" : "Las fotos que nos has enviado"}
              </h2>
              <p className="text-sm leading-relaxed text-ink-soft">
                Todo este informe sale de lo que se ve en estas imágenes. No es una prueba médica.
              </p>
            </div>
            {esClinica ? (
              <div className="grid grid-cols-3 gap-2">
                {fotos
                  .filter((f) => f.url)
                  .map((f) => (
                    <a
                      key={f.url}
                      href={f.url!}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="relative aspect-square overflow-hidden rounded-xl border border-line bg-paper-dim"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={f.url!} alt={f.angulo} className="h-full w-full object-cover" />
                    </a>
                  ))}
              </div>
            ) : (
              <FotosEstudio estudioId={estudioId} fotos={fotos} faltan={fiabilidad.faltan} />
            )}
          </section>

          {!esClinica && (
          <>
          {/* CTA de la columna derecha. Mensaje genérico a propósito: en
              este punto no sabemos la ciudad del paciente, así que no se
              da ninguna cifra de clínicas ni de encaje. */}
          <section className="flex flex-col gap-4 rounded-3xl bg-paper-dim p-7">
            <div className="flex items-start gap-4">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white text-teal-dark shadow-sm">
                <Stethoscope className="h-7 w-7" aria-hidden />
              </span>
              <div className="flex flex-col gap-1">
                <p className="font-display text-lg font-bold leading-snug text-teal-dark">
                  Encuentra las mejores clínicas para tu caso
                </p>
                <p className="text-[15px] leading-relaxed text-ink-soft">
                  Rellena el formulario en 2 minutos y elegiremos las 5 que mejor encajen contigo para pedirles presupuesto.
                </p>
              </div>
            </div>
            <Link
              href={hrefPresupuesto}
              className="press flex h-[52px] items-center justify-center rounded-full bg-yellow font-display text-[17px] font-bold text-teal-dark shadow-lg shadow-yellow/30 transition hover:opacity-90"
            >
              {contenido.rec.botonLateral}
            </Link>
            <p className="flex items-center justify-center gap-1.5 text-center text-[13px] text-ink-soft">
              <Lock className="h-3.5 w-3.5" aria-hidden /> Gratis y sin compromiso. Tus datos solo llegan a esas clínicas.
            </p>
          </section>
          </>
          )}
        </aside>
      </div>

      {/* Qué esperar */}
      <section className="flex flex-col gap-8 border-t border-line px-6 py-10 sm:px-10">
        <h2 className="font-display text-3xl font-extrabold text-teal-dark sm:text-4xl">{contenido.esperar.titulo}</h2>
        <ol
          className="relative grid gap-6 sm:gap-4 sm:[grid-template-columns:var(--cols)]"
          style={{ ["--cols" as string]: `repeat(${contenido.esperar.pasos.length}, minmax(0, 1fr))` }}
        >
          <span
            aria-hidden
            className="absolute left-[8%] right-[8%] top-[13px] hidden h-1 rounded-full bg-gradient-to-r from-brand-green to-brand-blue sm:block"
          />
          {contenido.esperar.pasos.map((s) => (
            <li key={s.when} className="relative flex items-start gap-4 sm:flex-col sm:items-center sm:gap-2.5 sm:text-center">
              <span aria-hidden className="h-[30px] w-[30px] shrink-0 rounded-full border-4 border-teal-dark bg-white" />
              <span className="flex flex-col gap-1">
                <span className="font-display text-xl font-bold text-teal-dark">{s.when}</span>
                <span className="text-[15px] leading-snug text-ink-soft">{s.what}</span>
              </span>
            </li>
          ))}
        </ol>
      </section>

      {/* CTA final */}
      {!esClinica && (
      <div className="px-6 pb-10 sm:px-10">
        <section className="grid items-center gap-10 rounded-3xl bg-paper-dim p-8 sm:p-12 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
          <div className="flex flex-col gap-4">
            <h2 className="font-display text-3xl font-extrabold leading-tight text-teal-dark sm:text-[40px]">
              {contenido.cta.titulo}
            </h2>
            <p className="text-lg leading-relaxed text-ink-soft">
              Usamos este informe para que no tengas que explicar tu caso cinco veces. Tú decides con qué clínica reservar.
            </p>
            <Link
              href={hrefPresupuesto}
              className="press inline-flex items-center gap-2 self-start rounded-full bg-yellow px-8 py-4 font-display text-xl font-bold text-teal-dark shadow-lg shadow-yellow/30 transition hover:opacity-90"
            >
              {contenido.cta.boton} <ArrowRight className="h-5 w-5" aria-hidden />
            </Link>
          </div>
          <ol className="flex flex-col gap-3">
            {[
              { t: "Formulario de 2 minutos", d: "Nos cuentas un poco más de ti, cuándo te gustaría empezar y tus preferencias." },
              { t: "Las clínicas te responden", d: "Recibes sus propuestas en Growwly, una al lado de la otra." },
              { t: "Eliges y reservas", d: "Reservas la cita con la que más te convenza." },
            ].map((p, i) => (
              <li key={p.t} className="flex items-start gap-4 rounded-[20px] bg-white px-5 py-5">
                <span className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full bg-yellow font-display text-base font-extrabold text-teal-dark">
                  {i + 1}
                </span>
                <span className="flex flex-col gap-0.5">
                  <span className="font-display text-lg font-bold text-teal-dark">{p.t}</span>
                  <span className="text-[15px] leading-relaxed text-ink-soft">{p.d}</span>
                </span>
              </li>
            ))}
          </ol>
        </section>
      </div>
      )}

      <p className="border-t border-line px-6 py-6 text-[13px] leading-relaxed text-ink-soft sm:px-10">
        Esto es una primera impresión visual generada con inteligencia artificial, no un diagnóstico médico. Solo un
        especialista, en consulta, puede valorar tu caso de verdad. Tus fotos se guardan de forma privada y solo las
        verán las clínicas a las que pidas presupuesto o consulta.
      </p>
    </div>
  );
}
