"use client";

import Image from "next/image";
import { useCallback, useRef, useState } from "react";

/**
 * Comparador de fotos antes/después: arrastrando el tirador (con el
 * ratón, el dedo, o las flechas del teclado si está enfocado) se
 * desliza la foto de "antes" por encima de la de "después".
 */
export function AntesDespuesSlider({
  antes,
  despues,
  alt,
}: {
  antes: string;
  despues: string;
  alt: string;
}) {
  const [pos, setPos] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const arrastrando = useRef(false);

  const actualizarDesdeX = useCallback((clientX: number) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const pct = ((clientX - rect.left) / rect.width) * 100;
    setPos(Math.min(100, Math.max(0, pct)));
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative aspect-square w-full select-none overflow-hidden rounded-xl bg-sage"
    >
      <Image
        src={despues}
        alt={`${alt} — después`}
        fill
        sizes="(min-width: 640px) 400px, 90vw"
        className="pointer-events-none object-cover"
      />
      <span className="pointer-events-none absolute bottom-2 right-2 rounded bg-ink/60 px-1.5 py-0.5 text-[10px] font-medium text-white">
        Después
      </span>

      <div
        className="pointer-events-none absolute inset-0"
        style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}
      >
        <Image
          src={antes}
          alt={`${alt} — antes`}
          fill
          sizes="(min-width: 640px) 400px, 90vw"
          className="object-cover"
        />
        <span className="absolute bottom-2 left-2 rounded bg-ink/60 px-1.5 py-0.5 text-[10px] font-medium text-white">
          Antes
        </span>
      </div>

      {/* El arrastre solo se inicia desde este tirador (la línea +
          el círculo central) — nunca desde el resto de la foto, para
          no chocar con el scroll vertical de la página en móvil. */}
      <div
        role="slider"
        tabIndex={0}
        aria-label={`Comparar antes y después — ${alt}`}
        aria-valuenow={Math.round(pos)}
        aria-valuemin={0}
        aria-valuemax={100}
        className="absolute inset-y-0 w-8 -translate-x-1/2 touch-none outline-none"
        style={{ left: `${pos}%` }}
        onPointerDown={(e) => {
          arrastrando.current = true;
          e.currentTarget.setPointerCapture(e.pointerId);
          actualizarDesdeX(e.clientX);
        }}
        onPointerMove={(e) => {
          if (arrastrando.current) actualizarDesdeX(e.clientX);
        }}
        onPointerUp={() => {
          arrastrando.current = false;
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft") setPos((p) => Math.max(0, p - 5));
          if (e.key === "ArrowRight") setPos((p) => Math.min(100, p + 5));
        }}
      >
        <div className="pointer-events-none absolute inset-y-0 left-1/2 w-0.5 -translate-x-1/2 bg-white shadow" />
        <div className="pointer-events-none absolute top-1/2 left-1/2 flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-xs text-teal-dark shadow-md focus-visible:ring-2 focus-visible:ring-teal">
          ↔
        </div>
      </div>
    </div>
  );
}
