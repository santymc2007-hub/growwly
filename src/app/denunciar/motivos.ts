export const MOTIVOS_DENUNCIA = {
  informacion_falsa: "Información falsa o engañosa sobre una clínica",
  resena_falsa: "Reseña u opinión falsa",
  publicidad_sanitaria: "Publicidad sanitaria engañosa o promesas de resultados",
  datos_personales: "Mis datos personales o mi imagen sin permiso",
  propiedad_intelectual: "Fotos o textos copiados sin permiso",
  otro: "Otro contenido ilegal",
} as const;

export type MotivoDenuncia = keyof typeof MOTIVOS_DENUNCIA;

export function esMotivo(valor: string): valor is MotivoDenuncia {
  return Object.hasOwn(MOTIVOS_DENUNCIA, valor);
}
