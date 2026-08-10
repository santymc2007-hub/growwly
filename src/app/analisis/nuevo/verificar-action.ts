"use server";

import { verificarCalidadFoto } from "@/lib/ai/verificar-foto";

const ETIQUETAS: Record<string, string> = {
  frontal: "una foto frontal, de cara",
  donante: "una foto de la nuca / zona donante, de espaldas",
  coronilla: "una foto de la coronilla, vista desde arriba",
  perfil_derecho: "una foto de perfil derecho",
  perfil_izquierdo: "una foto de perfil izquierdo",
};

export async function verificarFotoSubida(formData: FormData) {
  const foto = formData.get("foto");
  const orientacion = String(formData.get("orientacion") ?? "");

  if (!(foto instanceof File) || foto.size === 0) {
    return { ok: true, mensaje: "" };
  }

  // Comprobación básica de tamaño de archivo, sin gastar una llamada a IA.
  if (foto.size < 15_000) {
    return {
      ok: false,
      mensaje: "El archivo parece demasiado pequeño o de muy baja calidad.",
    };
  }

  const buffer = Buffer.from(await foto.arrayBuffer());
  const base64 = buffer.toString("base64");
  const mediaType = foto.type || "image/jpeg";

  const etiqueta = ETIQUETAS[orientacion] ?? orientacion;

  return verificarCalidadFoto(base64, mediaType, etiqueta);
}
