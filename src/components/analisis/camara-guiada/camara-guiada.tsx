"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AlertCircle, Check, ChevronLeft, Lightbulb, RotateCcw, Smartphone, Users, Volume2, X, ArrowRight } from "lucide-react";
import { trackEvent } from "@/lib/analytics/events";
import { MedidorCalidad, capturarFotograma, UMBRAL, type Calidad } from "./calidad";
import { cargarDetector, detectarCara, type Cara } from "./cara";
import { activarAvisos, callar, decir, pitido, vibrar } from "./avisos";
import { INSTRUCCION_LIBRE, PASOS, TITULO_PASO, type ModoCoronilla, type Paso, type PasoId } from "./pasos";

type Captura = { file: File; url: string; dudosa: boolean };
type Fase = "preparacion" | "toma" | "elegir-coronilla" | "revision" | "error-camara";
type Guia = {
  texto: string;
  sub: string;
  luz: boolean | null;
  nitidez: boolean | null;
  encuadre: boolean | null;
  /** 0-1: cuánto falta para girar (perfiles) o para disparar (libre). */
  progreso: number | null;
  listo: boolean;
};

const GUIA_INICIAL: Guia = {
  texto: "Abriendo la cámara…",
  sub: "",
  luz: null,
  nitidez: null,
  encuadre: null,
  progreso: null,
  listo: false,
};

// Óvalo guía, relativo al contenedor (ancho/alto de la pantalla).
const OVALO = { cx: 0.5, cy: 0.45, rxAncho: 0.36, proporcion: 1.32 };
const MANTENER_MS = 450;
const MANTENER_LIBRE_MS = 1300;
const ESPERA_LIBRE_MS = { ayuda: 1500, solo: 4500 };

export function CamaraGuiada({
  onTerminar,
  onCerrar,
}: {
  onTerminar: (fotos: File[], info: { coronilla: ModoCoronilla | "saltada" }) => void;
  onCerrar: () => void;
}) {
  const [fase, setFase] = useState<Fase>("preparacion");
  const [indice, setIndice] = useState(0);
  const [modo, setModo] = useState<ModoCoronilla | "saltada" | null>(null);
  const [capturas, setCapturas] = useState<Partial<Record<PasoId, Captura>>>({});
  const [recienHecha, setRecienHecha] = useState<PasoId | null>(null);
  const [repitiendo, setRepitiendo] = useState(false);
  const [guia, setGuia] = useState<Guia>(GUIA_INICIAL);
  const [detectorFallo, setDetectorFallo] = useState(false);
  const [espejo, setEspejo] = useState(true);

  const videoRef = useRef<HTMLVideoElement>(null);
  const contRef = useRef<HTMLDivElement>(null);
  const capturandoRef = useRef(false);
  const ladoPerfilRef = useRef<"a" | "b" | null>(null);
  const capturasRef = useRef(capturas);
  // Última lectura de calidad: marca como "Revísala" una foto hecha a mano con mala luz o movida.
  const calidadOkRef = useRef(true);

  const paso: Paso = PASOS[indice];
  const enToma = fase === "toma" && !recienHecha;
  const camara = fase === "toma" ? paso.camara : null;

  useEffect(() => {
    capturasRef.current = capturas;
  }, [capturas]);

  // Sin scroll de la página mientras la cámara ocupa la pantalla.
  useEffect(() => {
    const previo = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previo;
      callar();
    };
  }, []);

  // Libera las miniaturas al salir.
  useEffect(
    () => () => {
      for (const c of Object.values(capturasRef.current)) if (c) URL.revokeObjectURL(c.url);
    },
    [],
  );

  // El modelo de la cara se empieza a cargar en cuanto se abre el flujo.
  useEffect(() => {
    cargarDetector().catch(() => setDetectorFallo(true));
  }, []);

  // Abre la cámara delantera (todas las fotos se hacen con ella).
  useEffect(() => {
    if (!camara) return;
    let cancelado = false;
    let stream: MediaStream | null = null;
    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: { facingMode: { ideal: camara }, width: { ideal: 1920 }, height: { ideal: 1920 } },
        });
        if (cancelado) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        const v = videoRef.current;
        if (!v) return;
        v.srcObject = stream;
        await v.play().catch(() => {});
        const ajustes = stream.getVideoTracks()[0]?.getSettings();
        // Solo se ve en espejo la cámara delantera (como un espejo de verdad).
        setEspejo(ajustes?.facingMode ? ajustes.facingMode === "user" : camara === "user");
      } catch {
        if (!cancelado) {
          setFase("error-camara");
          trackEvent("analisis_camara_error");
        }
      }
    })();
    return () => {
      cancelado = true;
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [camara]);


  const siguiente = useCallback(
    (desde: number) => {
      setRecienHecha(null);
      if (repitiendo) {
        setRepitiendo(false);
        setFase("revision");
        return;
      }
      if (desde === 2) {
        setFase("elegir-coronilla");
        return;
      }
      if (desde >= PASOS.length - 1) {
        setFase("revision");
        return;
      }
      setIndice(desde + 1);
    },
    [repitiendo],
  );

  const capturar = useCallback(
    async (dudosa: boolean) => {
      const v = videoRef.current;
      if (!v || capturandoRef.current) return;
      capturandoRef.current = true;
      try {
        const file = await capturarFotograma(v, PASOS[indice].archivo);
        if (!file) return;
        vibrar([60, 40, 60]);
        pitido(1320, 0.14);
        if (modo === "solo" && PASOS[indice].tipo === "libre") decir("¡Hecha!", 0);
        const id = PASOS[indice].id;
        setCapturas((prev) => {
          const vieja = prev[id];
          if (vieja) URL.revokeObjectURL(vieja.url);
          return { ...prev, [id]: { file, url: URL.createObjectURL(file), dudosa } };
        });
        setRecienHecha(id);
      } finally {
        capturandoRef.current = false;
      }
    },
    [indice, modo],
  );

  // Tras cada foto: tarjeta "¡Hecha!" y se pasa sola a la siguiente.
  useEffect(() => {
    if (!recienHecha) return;
    const t = setTimeout(() => siguiente(indice), 1800);
    return () => clearTimeout(t);
  }, [recienHecha, indice, siguiente]);

  // Voz al empezar coronilla o nuca en modo "solo".
  useEffect(() => {
    if (!enToma || modo !== "solo" || paso.tipo !== "libre") return;
    const frase = INSTRUCCION_LIBRE[paso.id as "coronilla" | "nuca"].solo.voz;
    if (frase) decir(frase, 0);
  }, [enToma, modo, paso]);

  // Bucle de guiado: mide cada fotograma, decide la instrucción y dispara sola.
  useEffect(() => {
    if (!enToma) return;
    const medidor = new MedidorCalidad();
    let raf = 0;
    let ultimo = 0;
    let okDesde = 0;
    let mejorNitidez = 0;
    let ultimoPitido = 0;
    const inicio = performance.now();
    let detector: Awaited<ReturnType<typeof cargarDetector>> | null = null;
    let vivo = true;
    let claveAnterior = "";
    let ultimoGiro: number | null = null;
    let ultimoGiroEn = 0;

    cargarDetector()
      .then((d) => {
        detector = d;
      })
      .catch(() => {});

    const publicar = (g: Guia) => {
      const clave = JSON.stringify(g);
      if (clave === claveAnterior) return;
      claveAnterior = clave;
      setGuia(g);
    };

    const vuelta = (t: number) => {
      if (!vivo) return;
      raf = requestAnimationFrame(vuelta);
      if (t - ultimo < 90) return;
      ultimo = t;
      const v = videoRef.current;
      const cont = contRef.current;
      if (!v || !cont || v.readyState < 2) return;

      const q = medidor.medir(v);
      if (!q) return;
      mejorNitidez = Math.max(mejorNitidez, q.nitidez);
      const luzOk = q.luz >= UMBRAL.luzMin && q.luz <= UMBRAL.luzMax;
      const nitidezOk = q.nitidez >= Math.max(25, mejorNitidez * 0.55);
      const quieto = q.movimiento <= UMBRAL.movimientoMax;
      calidadOkRef.current = luzOk && nitidezOk && quieto;

      let g: Guia;
      if (paso.tipo === "libre") {
        g = guiaLibre(paso.id as "coronilla" | "nuca", modo === "solo" ? "solo" : "ayuda", q, luzOk, nitidezOk, quieto);
        const listoParaContar = t - inicio > ESPERA_LIBRE_MS[modo === "solo" ? "solo" : "ayuda"];
        if (g.listo && listoParaContar) {
          if (!okDesde) okDesde = t;
          const avance = Math.min(1, (t - okDesde) / MANTENER_LIBRE_MS);
          g = { ...g, progreso: avance };
          if (t - ultimoPitido > 380) {
            pitido(660 + avance * 500, 0.06);
            ultimoPitido = t;
          }
          if (avance >= 1) {
            publicar(g);
            void capturar(false);
            return;
          }
        } else {
          okDesde = 0;
          g = { ...g, listo: false, progreso: null };
          if (modo === "solo" && listoParaContar && !quieto) decir("Quieto", 2500);
          if (modo === "solo" && listoParaContar && !luzOk) decir("Falta luz", 4000);
        }
        publicar(g);
        return;
      }

      // Pasos con la cara.
      if (!detector) {
        publicar({
          ...GUIA_INICIAL,
          texto: detectorFallo ? "Pon la cara dentro del óvalo" : "Preparando la guía…",
          sub: detectorFallo ? "Cuando estés bien, pulsa el botón para hacer la foto." : "Un segundo.",
          luz: luzOk,
          nitidez: nitidezOk,
        });
        return;
      }
      let cara: Cara | null = null;
      try {
        cara = detectarCara(detector, v);
      } catch {
        cara = null;
      }
      // De perfil completo el detector suele perder la cara: si la perdemos
      // justo después de verla bien girada, se da por buena la postura.
      if (cara) {
        ultimoGiro = cara.giro;
        ultimoGiroEn = t;
      } else if (t - ultimoGiroEn > 6000) {
        ultimoGiro = null;
      }
      g = paso.tipo === "frente"
        ? guiaFrente(cara, q, luzOk, nitidezOk, quieto, cont, v, espejo)
        : guiaPerfil(cara, q, luzOk, nitidezOk, quieto, cont, v, paso.id === "perfil2" ? ladoPerfilRef.current : null, ultimoGiro);

      if (g.listo) {
        if (!okDesde) okDesde = t;
        if (t - okDesde >= MANTENER_MS) {
          if (paso.id === "perfil1" && ultimoGiro !== null) ladoPerfilRef.current = ultimoGiro < 0.5 ? "a" : "b";
          publicar({ ...g, texto: "¡Quieto!", sub: "Haciendo la foto…" });
          void capturar(false);
          return;
        }
      } else {
        okDesde = 0;
      }
      publicar(g);
    };
    raf = requestAnimationFrame(vuelta);
    return () => {
      vivo = false;
      cancelAnimationFrame(raf);
    };
  }, [enToma, paso, modo, espejo, detectorFallo, capturar]);

  function empezar() {
    activarAvisos();
    trackEvent("analisis_camara_inicio");
    setGuia(GUIA_INICIAL);
    setIndice(0);
    setFase("toma");
  }

  function elegirModo(m: ModoCoronilla | "saltada") {
    setModo(m);
    if (m === "saltada") {
      setFase("revision");
      return;
    }
    activarAvisos();
    setGuia(GUIA_INICIAL);
    setIndice(3);
    setFase("toma");
  }

  function repetir(id: PasoId) {
    const i = PASOS.findIndex((p) => p.id === id);
    if (PASOS[i].tipo === "libre" && !modo) {
      setFase("elegir-coronilla");
      return;
    }
    setRepitiendo(true);
    setGuia(GUIA_INICIAL);
    setIndice(i);
    setFase("toma");
  }

  function usarFotos() {
    const fotos = PASOS.map((p) => capturas[p.id]?.file).filter((f): f is File => Boolean(f));
    trackEvent("analisis_camara_completada", { fotos: fotos.length, coronilla: modo ?? "saltada" });
    onTerminar(fotos, { coronilla: modo ?? "saltada" });
  }

  const numPaso = fase === "toma" ? indice + 1 : fase === "elegir-coronilla" ? 4 : 5;
  const hechas = PASOS.filter((p) => capturas[p.id]).length;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Valoración con la cámara"
      className="fixed inset-0 z-[100] flex flex-col bg-[#0c1c19] text-white"
    >
      {/* Cámara (también detrás de la tarjeta "¡Hecha!") */}
      {fase === "toma" && (
        <div ref={contRef} className="absolute inset-0 overflow-hidden [container-type:size]" data-clarity-mask="true">
          <video
            ref={videoRef}
            playsInline
            muted
            autoPlay
            className={`h-full w-full object-cover ${espejo ? "-scale-x-100" : ""}`}
          />
          {paso.tipo !== "libre" && <OvaloGuia listo={guia.listo || recienHecha === paso.id} />}
          {paso.tipo === "libre" && <CirculoGuia listo={guia.listo || recienHecha === paso.id} />}
        </div>
      )}

      {/* Barra superior */}
      <div className={`relative z-10 px-4 pb-3 pt-[max(16px,env(safe-area-inset-top))] ${fase === "toma" ? "bg-gradient-to-b from-black/60 to-transparent" : "bg-white text-teal-dark"}`}>
        <div className="mx-auto flex max-w-md items-center gap-3">
          <button
            type="button"
            onClick={onCerrar}
            aria-label="Salir de la cámara"
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${fase === "toma" ? "bg-black/45" : "bg-paper-dim"}`}
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
          {fase !== "preparacion" && fase !== "error-camara" && (
            <>
              <div className="grid flex-1 grid-cols-5 gap-1.5">
                {PASOS.map((p, i) => (
                  <span
                    key={p.id}
                    className={`h-[5px] rounded-full ${
                      capturas[p.id] || (fase === "toma" && i === indice)
                        ? "bg-lima"
                        : fase === "toma"
                          ? "bg-white/30"
                          : "bg-line"
                    }`}
                  />
                ))}
              </div>
              <span className="shrink-0 text-sm font-semibold">{fase === "revision" ? `${hechas} de 5` : `${numPaso} de 5`}</span>
            </>
          )}
        </div>
        {fase === "toma" && (
          <p className="mt-3 text-center font-display text-lg font-bold">{TITULO_PASO[paso.id]}</p>
        )}
      </div>

      {fase === "preparacion" && <Preparacion onEmpezar={empezar} onSubir={onCerrar} />}

      {fase === "error-camara" && (
        <div className="relative z-10 flex flex-1 flex-col bg-white px-5 pb-8 pt-6 text-ink">
          <div className="mx-auto flex w-full max-w-md flex-1 flex-col">
            <AlertCircle className="h-10 w-10 text-orange" aria-hidden />
            <h2 className="mt-4 font-display text-2xl font-extrabold text-teal-dark">No hemos podido abrir la cámara</h2>
            <p className="mt-2 text-[15px] leading-relaxed text-ink-soft">
              Revisa que el navegador tenga permiso para usar la cámara (en los ajustes del móvil o tocando el icono
              junto a la dirección web) y vuelve a intentarlo. También puedes subir tus fotos.
            </p>
            <div className="mt-auto flex flex-col gap-2.5 pt-8">
              <button
                type="button"
                onClick={() => {
                  setGuia(GUIA_INICIAL);
                  setFase("preparacion");
                }}
                className="press min-h-[54px] rounded-full bg-yellow text-[17px] font-bold text-teal-dark"
              >
                Volver a intentarlo
              </button>
              <button type="button" onClick={onCerrar} className="min-h-11 text-[15px] font-semibold text-teal-dark">
                Subir mis fotos
              </button>
            </div>
          </div>
        </div>
      )}

      {fase === "elegir-coronilla" && <ElegirCoronilla onElegir={elegirModo} />}

      {fase === "revision" && (
        <Revision capturas={capturas} onRepetir={repetir} onUsar={usarFotos} onFaltan={() => setFase("elegir-coronilla")} />
      )}

      {/* Guía durante la toma */}
      {fase === "toma" && !recienHecha && (
        <div className="relative z-10 mt-auto px-4 pb-[max(20px,env(safe-area-inset-bottom))]">
          <div className="mx-auto flex max-w-md flex-col items-center gap-3">
            {paso.tipo !== "libre" && (
              <div className="flex flex-wrap justify-center gap-2">
                <Chip ok={guia.luz} texto="Luz" />
                <Chip ok={guia.nitidez} texto="Nitidez" />
                <Chip ok={guia.encuadre} texto="Encuadre" />
              </div>
            )}
            {guia.progreso !== null && (
              <div className="w-full rounded-2xl bg-black/55 px-3.5 py-3">
                <div className="h-2 overflow-hidden rounded-full bg-white/20">
                  <div className="h-2 rounded-full bg-lima transition-[width] duration-100" style={{ width: `${Math.round(guia.progreso * 100)}%` }} />
                </div>
              </div>
            )}
            {modo === "solo" && paso.tipo === "libre" && (
              <p className="flex items-center gap-2 rounded-full bg-black/55 px-3 py-1.5 text-[13px] font-medium text-sage">
                <Volume2 className="h-4 w-4 text-lima" aria-hidden />
                Pitidos más rápidos = ya casi. Al hacer la foto suena un pitido largo.
              </p>
            )}
            <div aria-live="polite" className="w-full rounded-[22px] bg-white px-[18px] py-4 text-center text-teal-dark">
              <p className="font-display text-2xl font-extrabold leading-tight">{guia.texto}</p>
              {guia.sub && <p className="mt-1.5 text-sm text-ink-soft">{guia.sub}</p>}
            </div>
            {/* Disparador manual, siempre visible: la foto también se hace sola. */}
            <button
              type="button"
              onClick={() => capturar(!calidadOkRef.current)}
              aria-label="Hacer la foto ahora"
              className="press flex h-[72px] w-[72px] items-center justify-center rounded-full border-4 border-white/90 bg-white/20"
            >
              <span className="h-[54px] w-[54px] rounded-full bg-white" />
            </button>
          </div>
        </div>
      )}

      {/* Tarjeta tras cada foto */}
      {fase === "toma" && recienHecha && capturas[recienHecha] && (
        <div className="relative z-10 mt-auto px-4 pb-[max(20px,env(safe-area-inset-bottom))]">
          <div className="mx-auto flex max-w-md flex-col gap-3.5 rounded-3xl bg-white p-4 text-ink">
            <div className="flex items-center gap-3.5">
              {/* eslint-disable-next-line @next/next/no-img-element -- miniatura local (blob:) */}
              <img src={capturas[recienHecha]!.url} alt="" className="h-20 w-16 shrink-0 rounded-xl object-cover" data-clarity-mask="true" />
              <div>
                <p className="font-display text-[22px] font-extrabold text-teal-dark">¡{TITULO_PASO[recienHecha]} hecha!</p>
                <p className="mt-0.5 text-sm text-ink-soft">Seguimos en un momento…</p>
              </div>
            </div>
            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setRecienHecha(null);
                  setGuia(GUIA_INICIAL);
                }}
                className="min-h-12 flex-1 rounded-full border-[1.5px] border-line font-semibold text-teal-dark"
              >
                Repetir
              </button>
              <button
                type="button"
                onClick={() => siguiente(indice)}
                className="min-h-12 flex-1 rounded-full bg-teal-dark font-semibold text-white"
              >
                Seguir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- Decisiones de guiado ---------- */

function geometria(cont: HTMLElement, v: HTMLVideoElement) {
  const cw = cont.clientWidth;
  const ch = cont.clientHeight;
  const escala = Math.max(cw / v.videoWidth, ch / v.videoHeight);
  const rx = cw * OVALO.rxAncho;
  return {
    cw,
    ch,
    escala,
    ox: (v.videoWidth * escala - cw) / 2,
    oy: (v.videoHeight * escala - ch) / 2,
    cx: cw * OVALO.cx,
    cy: ch * OVALO.cy,
    rx,
    ry: Math.min(rx * OVALO.proporcion, ch * 0.32),
  };
}

function enPantalla(cara: Cara, cont: HTMLElement, v: HTMLVideoElement, espejo: boolean) {
  const g = geometria(cont, v);
  let x = cara.x * v.videoWidth * g.escala - g.ox;
  if (espejo) x = g.cw - x;
  const y = cara.y * v.videoHeight * g.escala - g.oy;
  const alto = cara.alto * v.videoHeight * g.escala;
  return { g, x, y, alto };
}

function guiaFrente(
  cara: Cara | null,
  q: Calidad,
  luzOk: boolean,
  nitidezOk: boolean,
  quieto: boolean,
  cont: HTMLElement,
  v: HTMLVideoElement,
  espejo: boolean,
): Guia {
  const base = { luz: luzOk, nitidez: nitidezOk && quieto, progreso: null, listo: false };
  if (!cara) return { ...base, encuadre: false, texto: "Pon la cara dentro del óvalo", sub: "Móvil a la altura de los ojos." };
  if (!luzOk)
    return {
      ...base,
      encuadre: null,
      texto: q.luz < UMBRAL.luzMin ? "Necesitas más luz" : "Hay demasiada luz",
      sub: q.luz < UMBRAL.luzMin ? "Ponte de cara a una ventana o enciende la luz." : "Apártate un poco de la luz directa.",
    };
  const { g, x, y, alto } = enPantalla(cara, cont, v, espejo);
  const relAlto = alto / (g.ry * 2);
  if (relAlto < 0.45) return { ...base, encuadre: false, texto: "Acércate un poco", sub: "Que la cara llene el óvalo." };
  if (relAlto > 0.95) return { ...base, encuadre: false, texto: "Aléjate un poco", sub: "Que se vea toda la cabeza dentro del óvalo." };
  const dx = (x - g.cx) / g.rx;
  const dy = (y - g.cy) / g.ry;
  if (Math.abs(dx) > 0.3)
    return { ...base, encuadre: false, texto: dx < 0 ? "Muévete un poco a tu derecha" : "Muévete un poco a tu izquierda", sub: "Mete la cara dentro del óvalo." };
  if (Math.abs(dy) > 0.3)
    return { ...base, encuadre: false, texto: dy < 0 ? "Sube un poco el móvil" : "Baja un poco el móvil", sub: "Mete la cara dentro del óvalo." };
  if (cara.giro < 0.34 || cara.giro > 0.66)
    return { ...base, encuadre: false, texto: "Mira de frente a la pantalla", sub: "Sin girar la cabeza." };
  if (cara.cabeceo < 0.25 || cara.cabeceo > 0.65)
    return { ...base, encuadre: false, texto: "Pon la cabeza recta", sub: "Mirando al frente, ni arriba ni abajo." };
  if (!quieto || !nitidezOk) return { ...base, encuadre: true, texto: "Quieto…", sub: "Un momento sin moverte." };
  return { ...base, encuadre: true, texto: "¡Perfecto, quieto!", sub: "La foto se hace sola.", listo: true };
}

function guiaPerfil(
  cara: Cara | null,
  q: Calidad,
  luzOk: boolean,
  nitidezOk: boolean,
  quieto: boolean,
  cont: HTMLElement,
  v: HTMLVideoElement,
  ladoPrevio: "a" | "b" | null,
  ultimoGiro: number | null,
): Guia {
  const base = { luz: luzOk, nitidez: nitidezOk && quieto, listo: false };
  const pedir = ladoPrevio ? "Ahora gira hacia el otro lado" : "Gira la cabeza a tu izquierda";
  if (!cara) {
    const girado = ultimoGiro !== null && Math.abs(ultimoGiro - 0.5) >= 0.2;
    const ladoUltimo: "a" | "b" = (ultimoGiro ?? 0.5) < 0.5 ? "a" : "b";
    if (girado && !(ladoPrevio && ladoUltimo === ladoPrevio)) {
      if (!luzOk) return { ...base, encuadre: null, progreso: 1, texto: "Necesitas más luz", sub: "Ponte de cara a una ventana o enciende la luz." };
      if (!quieto || !nitidezOk) return { ...base, encuadre: true, progreso: 1, texto: "Quieto…", sub: "Aguanta así un momento." };
      return { ...base, encuadre: true, progreso: 1, texto: "¡Así, quieto!", sub: "La foto se hace sola.", listo: true };
    }
    return { ...base, encuadre: false, progreso: null, texto: pedir, sub: "Despacio, sin mover el móvil. La cabeza dentro del óvalo." };
  }
  if (!luzOk)
    return { ...base, encuadre: null, progreso: null, texto: "Necesitas más luz", sub: "Ponte de cara a una ventana o enciende la luz." };
  const { g, alto } = enPantalla(cara, cont, v, false);
  const relAlto = alto / (g.ry * 2);
  const desvio = Math.abs(cara.giro - 0.5);
  const avance = Math.min(1, desvio / 0.25);
  const lado: "a" | "b" = cara.giro < 0.5 ? "a" : "b";
  if (ladoPrevio && lado === ladoPrevio && desvio > 0.12)
    return { ...base, encuadre: false, progreso: 0, texto: "Hacia el otro lado", sub: "Este perfil ya lo tenemos." };
  if (relAlto < 0.4) return { ...base, encuadre: false, progreso: avance, texto: "Acércate un poco", sub: "Que la cabeza llene el óvalo." };
  if (desvio < 0.25) return { ...base, encuadre: false, progreso: avance, texto: pedir, sub: desvio > 0.15 ? "Un poco más…" : "Despacio, sin mover el móvil." };
  if (!quieto || !nitidezOk) return { ...base, encuadre: true, progreso: 1, texto: "Quieto…", sub: "Aguanta así un momento." };
  return { ...base, encuadre: true, progreso: 1, texto: "¡Así, quieto!", sub: "La foto se hace sola.", listo: true };
}

function guiaLibre(
  id: "coronilla" | "nuca",
  modo: ModoCoronilla,
  q: Calidad,
  luzOk: boolean,
  nitidezOk: boolean,
  quieto: boolean,
): Guia {
  const i = INSTRUCCION_LIBRE[id][modo];
  const base = { luz: luzOk, nitidez: nitidezOk, encuadre: null, progreso: null };
  if (!luzOk)
    return { ...base, listo: false, texto: q.luz < UMBRAL.luzMin ? "Falta luz" : "Demasiada luz", sub: "Busca una zona con luz uniforme." };
  if (!quieto) return { ...base, listo: false, texto: i.texto, sub: modo === "ayuda" ? "Sujeta el móvil quieto." : i.sub };
  return { ...base, listo: nitidezOk, texto: i.texto, sub: i.sub };
}

/* ---------- Piezas de interfaz ---------- */

function OvaloGuia({ listo }: { listo: boolean }) {
  // Mismas medidas que geometria(): ancho 72 % y alto = min(ancho·1,32, 64 % del alto).
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute left-1/2 top-[45%] h-[min(95cqw,64cqh)] w-[72cqw] -translate-x-1/2 -translate-y-1/2 rounded-[50%] transition-colors ${
        listo ? "border-[5px] border-solid border-lima" : "border-[3px] border-dashed border-white/95"
      }`}
    />
  );
}

function CirculoGuia({ listo }: { listo: boolean }) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute left-1/2 top-[45%] aspect-square w-[min(68cqw,60cqh)] -translate-x-1/2 -translate-y-1/2 rounded-full transition-colors ${
        listo ? "border-[5px] border-solid border-lima" : "border-[3px] border-dashed border-white/95"
      }`}
    />
  );
}

function Chip({ ok, texto }: { ok: boolean | null; texto: string }) {
  if (ok === false)
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-orange px-3 py-1.5 text-[13px] font-semibold text-ink">
        <AlertCircle className="h-3.5 w-3.5" aria-hidden />
        {texto}
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-black/55 px-3 py-1.5 text-[13px] font-semibold">
      {ok ? <Check className="h-3.5 w-3.5 text-lima" strokeWidth={3} aria-hidden /> : <span className="h-2 w-2 rounded-full bg-white/50" />}
      {texto}
    </span>
  );
}

function Preparacion({ onEmpezar, onSubir }: { onEmpezar: () => void; onSubir: () => void }) {
  const consejos = [
    { icono: Lightbulb, titulo: "Ponte de cara a una ventana", texto: "Luz de frente, nunca a tu espalda" },
    { icono: X, titulo: "Sin gorra ni gomina", texto: "Pelo seco y peinado como siempre" },
    { icono: Smartphone, titulo: "Móvil a la altura de los ojos", texto: "Brazo estirado, o apóyalo en algo" },
  ];
  return (
    <div className="relative z-10 flex flex-1 flex-col overflow-y-auto bg-white px-5 pb-[max(24px,env(safe-area-inset-bottom))] pt-4 text-ink">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col">
        <h2 className="font-display text-[28px] font-extrabold leading-tight text-teal-dark">Antes de empezar</h2>
        <p className="mt-2 text-[15px] leading-relaxed text-ink-soft">
          Te guiamos foto a foto y se hacen solas cuando están bien. El vídeo no sale de tu móvil: solo se envían las fotos.
        </p>
        <div className="mt-6 flex flex-col gap-2.5">
          {consejos.map(({ icono: Icono, titulo, texto }) => (
            <div key={titulo} className="flex items-center gap-3.5 rounded-[18px] bg-paper-dim px-4 py-3.5">
              <Icono className="h-7 w-7 shrink-0 text-teal-dark" aria-hidden />
              <div>
                <p className="font-semibold text-teal-dark">{titulo}</p>
                <p className="text-sm text-ink-soft">{texto}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-5 flex items-start gap-3 rounded-[18px] border-[1.5px] border-line px-4 py-3.5">
          <Volume2 className="mt-0.5 h-5 w-5 shrink-0 text-teal" aria-hidden />
          <p className="text-sm leading-relaxed">
            Sube el volumen: para la coronilla te podemos guiar <strong className="text-teal-dark">con la voz</strong>.
          </p>
        </div>
        <div className="mt-auto flex flex-col gap-2.5 pt-8">
          <p className="text-center text-[13px] text-ink-soft">Tu navegador te pedirá permiso para usar la cámara.</p>
          <button type="button" onClick={onEmpezar} className="press min-h-[54px] rounded-full bg-yellow text-[17px] font-bold text-teal-dark">
            Activar la cámara
          </button>
          <button type="button" onClick={onSubir} className="min-h-11 text-[15px] font-semibold text-teal-dark">
            Mejor subo mis fotos
          </button>
        </div>
      </div>
    </div>
  );
}

function ElegirCoronilla({ onElegir }: { onElegir: (m: ModoCoronilla | "saltada") => void }) {
  const opciones: { modo: ModoCoronilla | "saltada"; icono: typeof Users; titulo: string; texto: string; destacada?: boolean }[] = [
    { modo: "ayuda", icono: Users, titulo: "Me ayuda alguien", texto: "Le pasas el móvil y la pantalla le dice dónde apuntar", destacada: true },
    { modo: "solo", icono: Volume2, titulo: "Lo hago yo solo", texto: "Te guiamos con la voz y pitidos, sin tener que mirar la pantalla" },
    { modo: "saltada", icono: ArrowRight, titulo: "Saltar estas dos", texto: "La valoración será menos precisa en la coronilla" },
  ];
  return (
    <div className="relative z-10 flex flex-1 flex-col overflow-y-auto bg-white px-5 pb-[max(24px,env(safe-area-inset-bottom))] pt-4 text-ink">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col">
        <h2 className="font-display text-[28px] font-extrabold leading-tight text-teal-dark">Ahora la coronilla y la nuca</h2>
        <p className="mt-2 text-[15px] leading-relaxed text-ink-soft">Son las dos que no te puedes ver. Elige cómo hacerlas:</p>
        <div className="mt-5 flex flex-col gap-3">
          {opciones.map(({ modo, icono: Icono, titulo, texto, destacada }) => (
            <button
              key={modo}
              type="button"
              onClick={() => onElegir(modo)}
              className={`flex items-center gap-3.5 rounded-[20px] p-4 text-left ${
                destacada ? "border-2 border-teal-dark bg-paper-dim" : "border-[1.5px] border-line"
              }`}
            >
              <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] ${destacada ? "bg-teal-dark text-white" : "bg-paper-dim text-teal-dark"}`}>
                <Icono className="h-6 w-6" aria-hidden />
              </span>
              <span className="flex flex-1 flex-col gap-0.5">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="text-[17px] font-bold text-teal-dark">{titulo}</span>
                  {destacada && <span className="rounded-full bg-yellow px-2 py-0.5 text-[11px] font-semibold text-teal-dark">Mejor resultado</span>}
                </span>
                <span className="text-sm leading-snug text-ink-soft">{texto}</span>
              </span>
            </button>
          ))}
        </div>
        <div className="mt-auto flex items-start gap-3 rounded-2xl bg-paper-dim p-3.5 pt-3.5">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-teal" aria-hidden />
          <p className="text-sm leading-relaxed">La nuca sirve para ver cuánto pelo donante tienes. Es clave si piensas en un injerto.</p>
        </div>
      </div>
    </div>
  );
}

function Revision({
  capturas,
  onRepetir,
  onUsar,
  onFaltan,
}: {
  capturas: Partial<Record<PasoId, Captura>>;
  onRepetir: (id: PasoId) => void;
  onUsar: () => void;
  onFaltan: () => void;
}) {
  const faltanLibres = !capturas.coronilla && !capturas.nuca;
  return (
    <div className="relative z-10 flex flex-1 flex-col overflow-y-auto bg-white px-5 pb-[max(24px,env(safe-area-inset-bottom))] pt-4 text-ink">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col">
        <h2 className="font-display text-[28px] font-extrabold leading-tight text-teal-dark">Tus fotos, listas</h2>
        <p className="mt-1.5 text-[15px] text-ink-soft">Toca una si quieres repetirla.</p>
        <div className="mt-5 grid grid-cols-3 gap-2.5" data-clarity-mask="true">
          {PASOS.filter((p) => capturas[p.id]).map((p) => {
            const c = capturas[p.id]!;
            return (
              <button key={p.id} type="button" onClick={() => onRepetir(p.id)} aria-label={`Repetir ${p.nombre}`} className="flex flex-col gap-1.5">
                <span className="relative block h-[118px] overflow-hidden rounded-[14px] bg-[#1b302b]">
                  {/* eslint-disable-next-line @next/next/no-img-element -- miniatura local (blob:) */}
                  <img src={c.url} alt="" className="h-full w-full object-cover" />
                  <span className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-white/90 text-teal-dark">
                    <RotateCcw className="h-3.5 w-3.5" aria-hidden />
                  </span>
                  {c.dudosa && (
                    <span className="absolute inset-x-0 bottom-0 bg-orange py-1 text-center text-[11px] font-semibold text-ink">Revísala</span>
                  )}
                </span>
                <span className="text-center text-[13px] font-semibold text-teal-dark">{p.nombre}</span>
              </button>
            );
          })}
        </div>
        {faltanLibres && (
          <button type="button" onClick={onFaltan} className="mt-4 flex min-h-11 items-center gap-2 text-left text-sm font-semibold text-teal-dark underline underline-offset-4">
            <ChevronLeft className="h-4 w-4 rotate-180" aria-hidden />
            Añadir coronilla y nuca (más precisión)
          </button>
        )}
        <div className="mt-auto pt-8">
          <button type="button" onClick={onUsar} className="press min-h-[54px] w-full rounded-full bg-yellow text-[17px] font-bold text-teal-dark">
            Usar estas fotos
          </button>
        </div>
      </div>
    </div>
  );
}
