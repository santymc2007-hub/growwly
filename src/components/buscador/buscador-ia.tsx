"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, Check, Columns2, HelpCircle, RotateCcw, ShieldCheck, Star, X } from "lucide-react";
import { trackEvent } from "@/lib/analytics/events";
import {
  EJEMPLOS_BUSQUEDA,
  NOMBRE_TRATAMIENTO,
  PALABRAS_CLAVE,
  detectar,
  textoPalabra,
} from "@/lib/buscador/palabras";
import type { RespuestaBuscador } from "@/lib/buscador/tipos";
import { MarcaIA } from "./marca-ia";

// Donde no sale el botón: embudos de conversión y zonas privadas.
const RUTAS_SIN_BOTON = [
  "/analisis",
  "/cuenta",
  "/clinica",
  "/admin",
  "/auth",
  "/emails",
  "/leads",
  "/solicitud-enviada",
  "/solicitudes",
];

const CLAVE_BURBUJA = "growwly_ia_burbuja_cerrada";

const PASOS_CARGA = [
  "Leyendo lo que buscas…",
  "Revisando las fichas de las clínicas…",
  "Comparando precios y servicios…",
  "Escribiendo por qué te encajan…",
];

type Fase = "escribir" | "cargando" | "respuesta" | "comparar";

/** **negrita** → <strong>, sin HTML del modelo. */
function TextoConNegritas({ texto }: { texto: string }) {
  const partes = texto.split("**");
  return (
    <>
      {partes.map((p, i) => (i % 2 === 1 ? <strong key={i}>{p}</strong> : <span key={i}>{p}</span>))}
    </>
  );
}

/**
 * Buscador con IA de Growwly: botón flotante (abajo a la derecha) y la
 * capa a pantalla completa donde el paciente escribe lo que busca, ve
 * las palabras clave encenderse, y recibe 2–3 clínicas con el porqué y
 * la comparativa lado a lado.
 */
export function BuscadorIA() {
  const pathname = usePathname();
  const oculto = RUTAS_SIN_BOTON.some((r) => pathname === r || pathname.startsWith(`${r}/`));

  const [abierto, setAbierto] = useState(false);
  const [burbuja, setBurbuja] = useState(false);
  // Al pasar el ratón por el botón también se enseña la burbuja.
  const [encima, setEncima] = useState(false);
  const [fase, setFase] = useState<Fase>("escribir");
  const [texto, setTexto] = useState("");
  const [verMas, setVerMas] = useState(false);
  const [respuesta, setRespuesta] = useState<RespuestaBuscador | null>(null);
  const [error, setError] = useState<string | null>(null);
  const campo = useRef<HTMLTextAreaElement>(null);
  const [paso, setPaso] = useState(0);

  const deteccion = useMemo(() => detectar(texto), [texto]);

  // La burbuja aparece a los pocos segundos, salvo que ya la cerrara.
  useEffect(() => {
    if (oculto) return;
    let cerrada = false;
    try {
      cerrada = sessionStorage.getItem(CLAVE_BURBUJA) === "1";
    } catch {
      // sin almacenamiento: se enseña igual
    }
    if (cerrada) return;
    const t = setTimeout(() => setBurbuja(true), 4000);
    return () => clearTimeout(t);
  }, [oculto]);

  // Escape cierra; el fondo no hace scroll con la capa abierta.
  useEffect(() => {
    if (!abierto) return;
    const previo = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const tecla = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAbierto(false);
    };
    window.addEventListener("keydown", tecla);
    return () => {
      document.body.style.overflow = previo;
      window.removeEventListener("keydown", tecla);
    };
  }, [abierto]);

  // Mensajes mientras la IA piensa (tarda unos segundos).
  useEffect(() => {
    if (fase !== "cargando") return;
    const t = setInterval(() => setPaso((p) => Math.min(p + 1, PASOS_CARGA.length - 1)), 3500);
    return () => clearInterval(t);
  }, [fase]);

  if (oculto) return null;

  function cerrarBurbuja() {
    setBurbuja(false);
    setEncima(false);
    try {
      sessionStorage.setItem(CLAVE_BURBUJA, "1");
    } catch {
      // nada
    }
  }

  function nuevaBusqueda() {
    setTexto("");
    setRespuesta(null);
    setError(null);
    setVerMas(false);
    setFase("escribir");
    trackEvent("buscador_ia_nueva_busqueda");
    setTimeout(() => campo.current?.focus(), 50);
  }

  function abrir(origen: string) {
    cerrarBurbuja();
    setAbierto(true);
    trackEvent("buscador_ia_abierto", { origen, pagina: pathname });
    setTimeout(() => campo.current?.focus(), 50);
  }

  async function buscar() {
    if (texto.trim().length < 4) {
      setError("Cuéntanos un poco más lo que buscas.");
      return;
    }
    setError(null);
    setPaso(0);
    setFase("cargando");
    trackEvent("buscador_ia_busqueda", {
      tratamiento: deteccion.tratamiento ?? "ninguno",
      criterios: deteccion.activas.length,
    });
    try {
      const r = await fetch("/api/buscador", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ texto }),
      });
      const json = await r.json();
      if (!r.ok) throw new Error(json.error ?? "No hemos podido completar la búsqueda.");
      setRespuesta(json as RespuestaBuscador);
      setFase("respuesta");
      trackEvent("buscador_ia_resultado", { clinicas: (json as RespuestaBuscador).recomendadas.length });
    } catch (e) {
      setError(e instanceof Error ? e.message : "No hemos podido completar la búsqueda.");
      setFase("escribir");
    }
  }

  function tocarPalabra(id: string, activa: boolean) {
    if (activa) return;
    const p = PALABRAS_CLAVE.find((x) => x.id === id);
    if (!p) return;
    setTexto((t) => (t.trim() ? t.replace(/[\s.]+$/, "") + p.frase : p.frase.replace(/^[,\s]+/, "").replace(/^./, (c) => c.toUpperCase())));
    campo.current?.focus();
  }

  const palabras = PALABRAS_CLAVE.map((p) => ({
    ...p,
    activa: deteccion.activas.includes(p.id),
  })).filter((p) => p.principal || p.activa || verMas);
  const ocultas = PALABRAS_CLAVE.filter((p) => !p.principal && !deteccion.activas.includes(p.id)).length;

  return (
    <>
      {!abierto && (
        <div
          className="lanzador-ia fixed bottom-4 right-4 z-[90] flex items-end gap-3 sm:bottom-6 sm:right-6"
          onMouseEnter={() => setEncima(true)}
          onMouseLeave={() => setEncima(false)}
        >
          {(burbuja || encima) && (
            <div className="ia-entra relative max-w-[250px] rounded-[20px] rounded-br-md bg-white py-3 pl-4 pr-9 shadow-[0_12px_34px_rgba(16,58,58,0.22)] sm:max-w-[280px]">
              <button
                type="button"
                onClick={() => abrir("burbuja")}
                className="text-left"
              >
                <span className="block font-display text-[15px] font-extrabold leading-snug text-teal-dark sm:text-base">
                  ¿Te ayudo a encontrar lo que necesitas?
                </span>
                <span className="mt-1 block text-xs text-ink-soft sm:text-[13px]">
                  Dime qué buscas y comparo los centros por ti.
                </span>
                <span className="mt-2.5 inline-flex min-h-9 items-center rounded-full bg-yellow px-4 text-sm font-bold text-logo">
                  Empezar →
                </span>
              </button>
              <button
                type="button"
                onClick={cerrarBurbuja}
                aria-label="Cerrar el mensaje"
                className="absolute right-1.5 top-1.5 flex h-8 w-8 items-center justify-center rounded-full text-ink-soft hover:bg-paper-dim"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>
          )}
          <button
            type="button"
            onClick={() => abrir("boton")}
            aria-label="Buscar y comparar clínicas con IA"
            className="press flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-logo shadow-[0_10px_28px_rgba(16,58,58,0.35)] transition hover:scale-105 sm:h-[68px] sm:w-[68px]"
          >
            <MarcaIA tamano={28} />
          </button>
        </div>
      )}

      {abierto && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Buscador de clínicas con IA"
          className="fixed inset-0 z-[95] overflow-y-auto bg-[rgba(16,58,58,0.82)] backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) setAbierto(false);
          }}
        >
          <div className="mx-auto flex w-full max-w-[860px] flex-col gap-4 px-3 pb-10 pt-5 sm:px-6 sm:pt-16">
            <div className="flex items-end justify-between gap-3">
              <div className="flex items-end gap-3 sm:gap-4">
                <MarcaIA tamano={37} />
                <div>
                  <p className="font-display text-2xl font-extrabold leading-tight text-white sm:text-[34px]">
                    {fase === "comparar" ? "Lado a lado" : "¿Qué estás buscando?"}
                  </p>
                  {fase === "escribir" && (
                    <p className="mt-0.5 text-sm text-white/85 sm:text-[15px]">
                      Cuéntanoslo con tus palabras. La IA encuentra y compara las clínicas por ti.
                    </p>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAbierto(false)}
                aria-label="Cerrar"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25"
              >
                <X className="h-5 w-5" aria-hidden />
              </button>
            </div>

            {(fase === "escribir" || fase === "cargando") && (
              <>
                <div className="rounded-[26px] bg-white p-4 shadow-[0_24px_60px_rgba(0,0,0,0.25)] sm:p-5">
                  <label htmlFor="buscador-ia-texto" className="sr-only">
                    Describe lo que buscas
                  </label>
                  <textarea
                    id="buscador-ia-texto"
                    ref={campo}
                    rows={3}
                    value={texto}
                    maxLength={600}
                    onChange={(e) => setTexto(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        buscar();
                      }
                    }}
                    disabled={fase === "cargando"}
                    placeholder="Ej.: Busco hacerme un injerto en Palma, que no supere los 4.000 € y con las técnicas más avanzadas"
                    className="w-full resize-none border-0 bg-transparent text-lg font-medium leading-relaxed text-ink outline-none placeholder:text-ink-soft/60 sm:text-[21px]"
                  />

                  <div className="mt-2 border-t border-line/70 pt-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-soft sm:text-xs">
                        ¿Qué te importa? Toca para añadirlo
                      </span>
                      {deteccion.tratamiento && (
                        <span className="ia-entra rounded-full bg-logo px-3 py-1 text-xs font-bold text-white sm:text-[13px]">
                          Buscas: {NOMBRE_TRATAMIENTO[deteccion.tratamiento]}
                        </span>
                      )}
                    </div>
                    <div className="mt-2.5 flex flex-wrap gap-2">
                      {palabras.map((p) =>
                        p.activa ? (
                          <span
                            key={p.id}
                            className="ia-entra inline-flex min-h-9 items-center gap-1.5 rounded-full border-[1.5px] border-lima bg-[#eef6d0] px-3 text-sm font-semibold text-ink"
                          >
                            <Check className="h-3.5 w-3.5 text-logo" strokeWidth={3.2} aria-hidden />
                            {textoPalabra(p, deteccion)}
                          </span>
                        ) : (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => tocarPalabra(p.id, p.activa)}
                            className="inline-flex min-h-9 items-center rounded-full border-[1.5px] border-dashed border-[#c5cfcc] px-3 text-sm text-[#66746f] transition hover:border-logo hover:text-logo"
                          >
                            {p.texto}
                          </button>
                        ),
                      )}
                      <button
                        type="button"
                        onClick={() => setVerMas((v) => !v)}
                        aria-expanded={verMas}
                        className="min-h-9 px-2 text-sm font-semibold text-teal-dark underline underline-offset-4"
                      >
                        {verMas ? "Ver menos" : `Ver más (${ocultas})`}
                      </button>
                    </div>
                  </div>

                  {texto && fase === "escribir" && (
                    <button
                      type="button"
                      onClick={nuevaBusqueda}
                      className="mt-3 inline-flex min-h-9 items-center gap-1.5 text-sm font-semibold text-teal-dark hover:underline"
                    >
                      <RotateCcw className="h-4 w-4" aria-hidden />
                      Borrar y empezar de nuevo
                    </button>
                  )}

                  {error && <p className="mt-3 text-sm font-medium text-red-700">{error}</p>}

                  <div className="mt-4 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <span className="flex items-center gap-1.5 text-xs text-ink-soft">
                      <ShieldCheck className="h-3.5 w-3.5 shrink-0" aria-hidden />
                      Orientativo. Las clínicas Premium no salen mejor por pagar.
                    </span>
                    <button
                      type="button"
                      onClick={buscar}
                      disabled={fase === "cargando"}
                      className="press inline-flex min-h-[50px] items-center justify-center gap-2 rounded-full bg-yellow px-6 text-base font-bold text-logo disabled:opacity-70"
                    >
                      {fase === "cargando" ? PASOS_CARGA[paso] : "Buscar con IA →"}
                    </button>
                  </div>
                </div>

                {fase === "escribir" && !texto && (
                  <div>
                    <p className="text-[13px] font-semibold text-white/85">Prueba con un ejemplo</p>
                    <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                      {EJEMPLOS_BUSQUEDA.map((e) => (
                        <button
                          key={e}
                          type="button"
                          onClick={() => setTexto(e)}
                          className="min-h-11 rounded-2xl border border-white/30 bg-white/10 px-3.5 py-2.5 text-left text-sm text-white hover:bg-white/15 sm:max-w-[400px]"
                        >
                          «{e}»
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {fase === "respuesta" && respuesta && (
              <>
                <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
                  <button
                    type="button"
                    onClick={() => setFase("escribir")}
                    className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-yellow"
                  >
                    <ArrowLeft className="h-4 w-4" aria-hidden />
                    Cambiar búsqueda
                  </button>
                  <button
                    type="button"
                    onClick={nuevaBusqueda}
                    className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-white"
                  >
                    <RotateCcw className="h-4 w-4" aria-hidden />
                    Nueva búsqueda
                  </button>
                </div>

                <div className="ia-entra flex flex-col gap-5 rounded-[26px] bg-white p-5 shadow-[0_24px_60px_rgba(0,0,0,0.25)] sm:p-7">
                  <div>
                    <h2 className="font-display text-2xl font-extrabold leading-tight text-teal-dark sm:text-[28px]">
                      {respuesta.titulo}
                    </h2>
                    {respuesta.texto && (
                      <p className="mt-3 text-base leading-relaxed text-ink sm:text-[17px]">
                        <TextoConNegritas texto={respuesta.texto} />
                      </p>
                    )}
                    {respuesta.nota && (
                      <p className="mt-2 text-sm leading-relaxed text-ink-soft">{respuesta.nota}</p>
                    )}
                  </div>

                  {respuesta.recomendadas.length > 0 && (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {respuesta.recomendadas.map((c) => (
                        <div
                          key={c.id}
                          className={`flex flex-col gap-3 rounded-[20px] p-4 ${c.mejor ? "border-2 border-yellow" : "border border-line"}`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-sage">
                              {c.foto && (
                                <Image src={c.foto} alt="" fill sizes="64px" className="object-cover" />
                              )}
                            </div>
                            <div className="min-w-0">
                              {c.mejor && (
                                <span className="rounded-full bg-yellow px-2 py-0.5 text-[11px] font-bold text-logo">
                                  Mejor encaje
                                </span>
                              )}
                              <p className="mt-0.5 truncate font-display text-lg font-extrabold text-teal-dark">
                                {c.nombre}
                              </p>
                              <p className="flex items-center gap-1 text-xs text-ink-soft">
                                {c.ciudad}
                                {c.rating !== null && (
                                  <>
                                    {" · "}
                                    <Star className="h-3 w-3 fill-yellow text-yellow" aria-hidden />
                                    {c.rating.toLocaleString("es-ES")} ({c.resenas ?? 0})
                                  </>
                                )}
                              </p>
                            </div>
                          </div>
                          {(c.encaja.length > 0 || c.dudas.length > 0) && (
                            <ul className="flex flex-col gap-1.5 text-sm">
                              {c.encaja.map((e) => (
                                <li key={e} className="flex gap-2">
                                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-logo" strokeWidth={3} aria-hidden />
                                  {e}
                                </li>
                              ))}
                              {c.dudas.map((e) => (
                                <li key={e} className="flex gap-2 text-ink-soft">
                                  <HelpCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                                  {e}
                                </li>
                              ))}
                            </ul>
                          )}
                          <Link
                            href={c.href}
                            onClick={() => {
                              trackEvent("buscador_ia_ver_ficha", { clinic_id: c.id });
                              setAbierto(false);
                            }}
                            className="mt-auto text-sm font-semibold text-cyan-dark hover:underline"
                          >
                            Ver ficha →
                          </Link>
                        </div>
                      ))}
                    </div>
                  )}

                  {respuesta.descartadas.length > 0 && (
                    <div className="rounded-xl bg-paper-dim px-4 py-3 text-sm text-ink-soft">
                      <p className="font-semibold text-ink">Hemos dejado fuera</p>
                      <ul className="mt-1 flex flex-col gap-0.5">
                        {respuesta.descartadas.map((d) => (
                          <li key={d.nombre}>
                            {d.nombre}: {d.motivo}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="flex flex-col gap-3 border-t border-line pt-4 sm:flex-row sm:items-center sm:justify-between">
                    {respuesta.recomendadas.length > 1 ? (
                      <button
                        type="button"
                        onClick={() => {
                          setFase("comparar");
                          trackEvent("buscador_ia_comparar", { clinicas: respuesta.recomendadas.length });
                        }}
                        className="inline-flex min-h-[50px] items-center justify-center gap-2 rounded-full border-2 border-teal-dark px-5 text-[15px] font-bold text-teal-dark"
                      >
                        <Columns2 className="h-4 w-4" aria-hidden />
                        Ver las fichas lado a lado
                      </button>
                    ) : (
                      <span />
                    )}
                    <Link
                      href="/cuenta/solicitud/nueva"
                      onClick={() => trackEvent("buscador_ia_presupuesto", { clinicas: respuesta.recomendadas.length })}
                      className="press inline-flex min-h-[50px] items-center justify-center rounded-full bg-yellow px-6 text-base font-bold text-logo"
                    >
                      Pedir presupuesto gratis →
                    </Link>
                  </div>
                </div>
                <p className="text-xs leading-relaxed text-white/80">
                  Respuesta orientativa hecha con IA a partir de los datos públicos de cada ficha. Las
                  clínicas Premium no salen mejor por pagar. No es un consejo médico.
                </p>
              </>
            )}

            {fase === "comparar" && respuesta && (
              <>
                <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
                  <button
                    type="button"
                    onClick={() => setFase("respuesta")}
                    className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-yellow"
                  >
                    <ArrowLeft className="h-4 w-4" aria-hidden />
                    Volver a la respuesta
                  </button>
                  <button
                    type="button"
                    onClick={nuevaBusqueda}
                    className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-white"
                  >
                    <RotateCcw className="h-4 w-4" aria-hidden />
                    Nueva búsqueda
                  </button>
                </div>
                <div className="ia-entra overflow-x-auto rounded-[26px] bg-white p-4 shadow-[0_24px_60px_rgba(0,0,0,0.25)] sm:p-6">
                  <table className="w-full min-w-[560px] border-separate border-spacing-0 text-left text-sm">
                    <thead>
                      <tr>
                        <th className="w-40 pb-3" />
                        {respuesta.recomendadas.map((c) => (
                          <th key={c.id} className="pb-3 pr-3 align-bottom">
                            <span className="font-display text-lg font-extrabold text-teal-dark">{c.nombre}</span>
                            {c.mejor && (
                              <span className="ml-2 rounded-full bg-yellow px-2 py-0.5 align-middle text-[11px] font-bold text-logo">
                                Mejor encaje
                              </span>
                            )}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {respuesta.filas.map((f) => (
                        <tr key={f.id} className={f.pedida ? "bg-[#eef6d0]" : ""}>
                          <th scope="row" className={`border-t border-line/70 px-2 py-3 font-semibold ${f.pedida ? "text-logo" : "text-ink-soft"}`}>
                            {f.etiqueta}
                          </th>
                          {respuesta.recomendadas.map((c) => (
                            <td
                              key={c.id}
                              className={`border-t border-line/70 px-2 py-3 ${c.valores[f.id] === "No lo indica" ? "text-ink-soft" : f.pedida ? "font-semibold text-ink" : "text-ink"}`}
                            >
                              {c.valores[f.id]}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <p className="mt-3 flex items-center gap-2 text-xs text-ink-soft">
                    <span className="inline-block h-3 w-3 rounded bg-[#eef6d0] ring-1 ring-lima" />
                    Lo que has pedido · «No lo indica» = la clínica aún no lo ha rellenado
                  </p>
                </div>
                <Link
                  href="/cuenta/solicitud/nueva"
                  onClick={() => trackEvent("buscador_ia_presupuesto", { origen: "comparativa" })}
                  className="press inline-flex min-h-[50px] items-center justify-center self-end rounded-full bg-yellow px-6 text-base font-bold text-logo"
                >
                  Pedir presupuesto gratis →
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
