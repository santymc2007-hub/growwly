"use client";

import { useFormStatus } from "react-dom";
import { OverlayCargando } from "@/components/ui/overlay-cargando";

export function OverlayAnalizando() {
  const { pending } = useFormStatus();

  if (!pending) return null;

  return (
    <OverlayCargando mensaje="Subiendo y analizando tus fotos con IA… puede tardar hasta un minuto. No cierres ni recargues esta pantalla." />
  );
}
