"use client";

import { useEffect, useRef } from "react";
import { registrarPaso } from "@/lib/analytics/embudo";
import type { PasoEmbudo } from "@/lib/analytics/embudo-pasos";

/** Apunta un paso del embudo al mostrarse una página (una vez por visita a la página). */
export function PasoEmbudoAlVer({ paso, detalle }: { paso: PasoEmbudo; detalle?: string }) {
  const hecho = useRef(false);
  useEffect(() => {
    if (hecho.current) return;
    hecho.current = true;
    registrarPaso(paso, detalle);
  }, [paso, detalle]);
  return null;
}
