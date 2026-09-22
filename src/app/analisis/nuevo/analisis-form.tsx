"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { Camera, Check, CloudUpload, ImagePlus, X } from "lucide-react";
import { comprimirImagen } from "@/lib/comprimir-imagen";
import { OverlayCargando } from "@/components/ui/overlay-cargando";

// width/height = tamaño real del icono (svg viewBox o png), para que el
// navegador escale manteniendo su proporción en vez de forzarlo a un
// cuadrado y deformarlo.
const CARACTERISTICAS = [
  { icono: "/analisis/ic-rapido.svg", texto: "Rápido y fácil", w: 34, h: 63 },
  { icono: "/analisis/ic-verificado.svg", texto: "Clínicas verificadas", w: 56, h: 53 },
  { icono: "/analisis/ic-gratuito.svg", texto: "100% Gratuito", w: 44, h: 63 },
  { icono: "/analisis/ic-seguro.svg", texto: "Seguro y confidencial", w: 63, h: 60 },
] as const;

const GUIA = [
  { imagen: "/analisis/guia-frontal.png", etiqueta: "Frontal" },
  { imagen: "/analisis/guia-donante.png", etiqueta: "Zona donante" },
  { imagen: "/analisis/guia-coronilla.png", etiqueta: "Coronilla" },
  { imagen: "/analisis/guia-perfil-derecho.png", etiqueta: "Perfil derecho" },
  { imagen: "/analisis/guia-perfil-izquierdo.png", etiqueta: "Perfil izquierdo" },
] as const;

const CONSEJOS = [
  {
    icono: "/analisis/ic-buena-luz.png",
    titulo: "Buena luz",
    texto: "Luz natural y uniforme",
  },
  {
    icono: "/analisis/ic-sin-filtros.png",
    titulo: "Sin filtros",
    texto: "Ni retoques ni añadidos",
  },
  {
    icono: "/analisis/ic-cuero-visible.png",
    titulo: "Cuero cabelludo visible",
    texto: "Que se vea bien la zona afectada",
  },
] as const;

type FotoAdjunta = { id: string; file: File; url: string };

export function AnalisisForm({
  action,
  initialError,
}: {
  action: (formData: FormData) => void;
  initialError?: string;
}) {
  const [fotos, setFotos] = useState<FotoAdjunta[]>([]);
  const [estado, setEstado] = useState<"idle" | "comprimiendo" | "enviando">("idle");
  const [arrastrando, setArrastrando] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const camaraRef = useRef<HTMLInputElement>(null);
  const fotosAnadidasRef = useRef<HTMLDivElement>(null);

  async function agregarArchivos(lista: FileList | File[]) {
    const archivos = Array.from(lista).filter((f) => f.type.startsWith("image/"));
    if (archivos.length === 0) return;

    setEstado("comprimiendo");
    try {
      // Las fotos de móvil sin optimizar (a veces 5-10MB cada una, y a
      // veces en HEIC) se comprimen en cuanto se añaden — así la
      // miniatura ya es la versión ligera y no hay que repetir el
      // trabajo al enviar el formulario.
      const nuevas: FotoAdjunta[] = [];
      for (const file of archivos) {
        const comprimida = await comprimirImagen(file);
        nuevas.push({
          id: crypto.randomUUID(),
          file: comprimida,
          url: URL.createObjectURL(comprimida),
        });
      }
      setFotos((prev) => [...prev, ...nuevas]);
      // Baja hasta "Tus fotos añadidas" para que se vean las miniaturas
      // y el botón de analizar sin tener que buscarlos manualmente.
      fotosAnadidasRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    } finally {
      setEstado("idle");
    }
  }

  function quitarFoto(id: string) {
    setFotos((prev) => {
      const foto = prev.find((f) => f.id === id);
      if (foto) URL.revokeObjectURL(foto.url);
      return prev.filter((f) => f.id !== id);
    });
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (fotos.length === 0) return;

    setEstado("enviando");
    try {
      const formData = new FormData();
      for (const foto of fotos) formData.append("adicionales", foto.file);
      await action(formData);
      // La action redirige internamente al terminar (tanto si va bien
      // como si hay error), así que normalmente no se llega más allá.
    } finally {
      setEstado("idle");
    }
  }

  return (
    <>
      {estado !== "idle" && (
        <OverlayCargando
          mensaje={
            estado === "comprimiendo"
              ? "Optimizando tus fotos…"
              : "Subiendo y analizando tus fotos con IA… puede tardar hasta un minuto. No cierres ni recargues esta pantalla."
          }
        />
      )}

      {/* Hero: presentación + zona para añadir fotos */}
      <div className="relative">
        <div className="relative mx-auto max-w-[1600px] px-6 py-14 sm:py-16 lg:px-12 lg:py-0">
          <div className="relative z-10 min-w-0 lg:max-w-[430px] lg:py-11">
            <p className="text-xs font-bold uppercase tracking-widest text-teal">
              Tu pelo en buenas manos
            </p>
            <h1 className="mt-3 font-display text-4xl font-extrabold leading-tight text-teal-dark sm:text-5xl">
              Añade tus fotos
            </h1>
            <p className="mt-4 max-w-md text-base text-ink-soft">
              Puedes subirlas todas juntas. Con una foto ya puedes empezar,
              aunque a mayor número de fotos mayor fiabilidad en la
              valoración.
            </p>

            {initialError && (
              <p className="mt-4 max-w-md rounded-lg bg-error/10 px-4 py-3 text-sm text-error-dark">
                {decodeURIComponent(initialError)}
              </p>
            )}

            <div
              onDragOver={(e) => {
                e.preventDefault();
                setArrastrando(true);
              }}
              onDragLeave={() => setArrastrando(false)}
              onDrop={(e) => {
                e.preventDefault();
                setArrastrando(false);
                agregarArchivos(e.dataTransfer.files);
              }}
              className={`mt-7 max-w-md overflow-hidden rounded-2xl border-2 border-dashed shadow-sm transition lg:max-w-[22.25rem] lg:rounded-[18px] ${
                arrastrando ? "border-teal bg-sage/40" : "border-line bg-white"
              }`}
            >
              <div className="px-8 pt-8 text-center lg:px-7 lg:pt-7">
                <CloudUpload className="mx-auto h-10 w-10 text-teal-dark" aria-hidden />
                <p className="mt-3 font-display text-lg font-bold text-teal-dark lg:text-xl">
                  Arrastra tus fotos aquí
                </p>
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  className="press mt-4 inline-block rounded-full bg-yellow px-6 py-2.5 font-display text-sm font-bold text-teal-dark transition hover:opacity-90"
                >
                  Seleccionar fotos
                </button>
                <p className="mb-8 mt-2 text-xs text-ink-soft lg:mb-6">
                  Puedes seleccionar varias imágenes a la vez
                </p>
              </div>

              <div className="px-8 pb-8 text-center lg:bg-paper-dim lg:px-7 lg:pb-6 lg:pt-5">
                <div className="mb-4 flex items-center gap-3 text-xs font-medium text-ink-soft lg:mb-4">
                  <span className="h-px flex-1 bg-line" />
                  o
                  <span className="h-px flex-1 bg-line" />
                </div>

                <button
                  type="button"
                  onClick={() => camaraRef.current?.click()}
                  className="press inline-flex items-center gap-2 rounded-full border border-line bg-white px-5 py-2.5 text-sm font-semibold text-teal-dark transition hover:bg-paper-dim"
                >
                  <Camera className="h-4 w-4" aria-hidden />
                  Hacer una foto
                </button>
              </div>

              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => {
                  if (e.target.files) agregarArchivos(e.target.files);
                  e.target.value = "";
                }}
              />
              <input
                ref={camaraRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files) agregarArchivos(e.target.files);
                  e.target.value = "";
                }}
              />
            </div>
          </div>

          <div className="pointer-events-none absolute inset-y-0 right-0 hidden lg:block lg:w-[60%] xl:w-[56%]">
            <Image
              src="/brand/analisis-pareja-fotos.webp"
              alt="Pareja sujetando sus móviles, lista para subir sus fotos"
              fill
              sizes="45vw"
              className="object-contain"
              style={{ objectPosition: "right bottom" }}
              priority
            />
          </div>
        </div>
      </div>

      {/* A partir de aquí, todo vive en una única caja blanca, como en la home */}
      <div className="mx-auto max-w-[1600px] px-3 pb-8 sm:px-6 sm:pb-10">
        <div className="overflow-hidden rounded-3xl bg-white shadow-sm">
          {/* Características */}
          <div className="px-6 py-8 sm:px-10">
            <div className="grid grid-cols-2 gap-x-4 gap-y-6 rounded-2xl bg-paper-dim px-6 py-6 sm:flex sm:flex-wrap sm:items-center sm:justify-between sm:gap-4 sm:px-10 lg:flex-nowrap lg:divide-x lg:divide-line">
              {CARACTERISTICAS.map(({ icono, texto, w, h }) => (
                <div
                  key={texto}
                  className="flex items-center gap-3 lg:flex-1 lg:justify-center lg:px-6"
                >
                  <Image
                    src={icono}
                    alt=""
                    width={w}
                    height={h}
                    className="h-7 w-auto shrink-0 sm:h-9 lg:h-10"
                  />
                  <span className="text-sm font-bold text-teal-dark lg:whitespace-nowrap lg:text-base">
                    {texto}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Guía fotográfica */}
          <div className="border-t border-line px-6 py-10 sm:px-10 lg:border-t-0 lg:pt-2">
            <h2 className="font-display text-xl font-bold text-teal-dark sm:text-2xl">
              Aquí tienes una pequeña guía fotográfica de como tienen que ser
              las fotos que subas
            </h2>

            <div className="mt-8 flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between lg:gap-8">
              <div className="flex flex-wrap justify-center gap-x-6 gap-y-8 sm:gap-x-10 lg:flex-nowrap lg:justify-start lg:gap-x-6">
                {GUIA.map(({ imagen, etiqueta }) => (
                  <div key={etiqueta} className="text-center">
                    <div className="relative mx-auto aspect-square w-20 sm:w-32 lg:w-32 xl:w-36">
                      <Image
                        src={imagen}
                        alt=""
                        fill
                        sizes="(min-width: 1280px) 144px, (min-width: 1024px) 128px, (min-width: 640px) 128px, 80px"
                        className="object-contain"
                      />
                    </div>
                    <p className="mt-2 text-[11px] font-bold uppercase tracking-wide text-teal-dark sm:text-xs">
                      {etiqueta}
                    </p>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap justify-center gap-8 border-t border-line pt-8 sm:justify-start lg:w-[280px] lg:flex-none lg:flex-col lg:flex-nowrap lg:justify-start lg:gap-6 lg:border-t-0 lg:pt-2">
                {CONSEJOS.map(({ icono, titulo, texto }) => (
                  <div key={titulo} className="flex max-w-xs items-start gap-3">
                    <Image
                      src={icono}
                      alt=""
                      width={50}
                      height={50}
                      className="h-6 w-6 shrink-0 lg:h-8 lg:w-8"
                    />
                    <div>
                      <p className="text-sm font-bold text-teal-dark">{titulo}</p>
                      <p className="text-xs text-ink-soft lg:text-[13px]">{texto}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Fotos añadidas + envío */}
          <div
            ref={fotosAnadidasRef}
            className="border-t border-line px-6 py-10 sm:px-10 lg:border-t-0 lg:pb-10 lg:pt-2"
          >
            <div className="lg:rounded-2xl lg:bg-paper-dim lg:px-8 lg:py-7">
              <form onSubmit={onSubmit}>
                <div className="flex flex-wrap items-baseline gap-2">
                  <h2 className="font-display text-xl font-bold text-teal-dark">
                    Tus fotos añadidas:
                  </h2>
                  <span className="text-base font-semibold text-ink-soft">
                    {fotos.length} añadidas
                  </span>
                </div>

                <div className="mt-5 grid grid-cols-3 gap-4 sm:grid-cols-4 lg:grid-cols-6">
                  {fotos.map((foto) => (
                    <div
                      key={foto.id}
                      className="relative aspect-square overflow-hidden rounded-xl border border-line bg-sage/30"
                    >
                      <Image src={foto.url} alt="" fill sizes="150px" className="object-cover" />
                      <button
                        type="button"
                        onClick={() => quitarFoto(foto.id)}
                        aria-label="Quitar esta foto"
                        className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-white text-ink shadow transition hover:bg-error/10 hover:text-error-dark"
                      >
                        <X className="h-3.5 w-3.5" aria-hidden />
                      </button>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    className="flex aspect-square flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-line text-teal-dark transition hover:border-teal hover:bg-sage/20"
                  >
                    <ImagePlus className="h-6 w-6" aria-hidden />
                    <span className="text-xs font-semibold">Añadir más</span>
                  </button>
                </div>

                <div className="mt-8 flex flex-col items-start gap-4 border-t border-dashed border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal-dark text-white">
                      <Check className="h-3.5 w-3.5" aria-hidden />
                    </span>
                    <div>
                      <p className="text-sm font-bold text-teal-dark">
                        {fotos.length > 0
                          ? `${fotos.length} foto${fotos.length === 1 ? "" : "s"} lista${
                              fotos.length === 1 ? "" : "s"
                            } para valorar`
                          : "Añade al menos una foto para poder valorarla"}
                      </p>
                      <p className="text-xs text-ink-soft">
                        Valoración orientativa. No sustituye una consulta médica.
                      </p>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={fotos.length === 0 || estado !== "idle"}
                    className="press w-full rounded-full bg-yellow px-7 py-3.5 font-display text-sm font-bold text-teal-dark transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                  >
                    {estado === "enviando" ? "Analizando tus fotos…" : "Analiza mis fotos"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
