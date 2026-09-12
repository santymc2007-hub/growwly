// Etiquetas legibles para los valores guardados en `profiles` y
// `solicitudes_presupuesto`. Centralizado aquí para que el resumen del
// paciente, la ficha que ve la clínica y el email de notificación
// muestren siempre el mismo texto, en vez de mantener 3 copias sueltas.

export const SEXO_LABEL: Record<string, string> = {
  hombre: "Hombre",
  mujer: "Mujer",
};

export const TIPO_PERDIDA_LABEL: Record<string, string> = {
  entradas: "Entradas",
  coronilla: "Coronilla",
  difusa: "Difusa general",
  combinada: "Combinada",
};

export const PROGRESION_LABEL: Record<string, string> = {
  lenta: "Lenta (años)",
  moderada: "Moderada (meses)",
  rapida: "Rápida (semanas)",
  estable: "Estable",
};

export const CUANDO_LABEL: Record<string, string> = {
  lo_antes_posible: "Lo antes posible",
  "1_3_meses": "1 a 3 meses — Es urgente, ya está convencido/a",
  "3_6_meses": "3 a 6 meses — Convencido/a, sin prisa",
  "6_12_meses": "6 a 12 meses — Todavía no está convencido/a",
  flexible: "Flexible — Solo está explorando opciones",
};

export const DONDE_LABEL: Record<string, string> = {
  ciudad: "En su ciudad o cerca",
  provincia: "Abierto/a a su provincia",
  comunidad: "Abierto/a a su Comunidad Autónoma",
  sin_preferencia: "Sin preferencia (cualquier parte de España)",
};

export const PRIORIDAD_LABEL: Record<string, string> = {
  reputacion_cirujano: "La reputación y experiencia del cirujano",
  resenas_fotos: "Las reseñas y fotos de otros pacientes",
  tecnologia: "La tecnología que utiliza la clínica",
  precio: "El precio final",
};

export const FUMADOR_LABEL: Record<string, string> = {
  no_fumo: "No fuma",
  ocasional: "Fumador/a ocasional",
  regular: "Fumador/a regular",
};

export const CONDICIONES_MEDICAS_LABEL: Record<string, string> = {
  diabetes: "Diabetes",
  hipertension: "Hipertensión",
  problemas_cardiacos: "Problemas cardíacos",
  trastornos_coagulacion: "Trastornos de coagulación",
  enfermedades_autoinmunes: "Enfermedades autoinmunes",
  problemas_tiroideos: "Problemas tiroideos",
  depresion_ansiedad: "Depresión/Ansiedad",
  ninguna: "Ninguna",
};

/** Presupuesto: de 500€ a 20.000€ en pasos de 500€. */
export const PRESUPUESTO_PACIENTE_OPCIONES: string[] = Array.from(
  { length: 40 },
  (_, i) => String((i + 1) * 500),
);

export function labelPresupuesto(valor: string): string {
  if (valor === "flexible") return "Flexible";
  const n = Number(valor);
  return Number.isFinite(n) ? `${n.toLocaleString("es-ES")}€` : valor;
}

export function etiqueta(
  mapa: Record<string, string>,
  valor: string | null,
): string | null {
  if (!valor) return null;
  return mapa[valor] ?? valor;
}
