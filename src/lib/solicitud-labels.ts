// Etiquetas legibles para los valores guardados en `profiles` y
// `solicitudes_presupuesto`. Centralizado aquí para que el resumen del
// paciente, la ficha que ve la clínica y el email de notificación
// muestren siempre el mismo texto, en vez de mantener 3 copias sueltas.

export const SEXO_LABEL: Record<string, string> = {
  hombre: "Hombre",
  mujer: "Mujer",
};

/**
 * Escala Norwood-Hamilton (patrón masculino). Cada entrada lleva una
 * descripción corta para que el paciente se autoidentifique sin tener
 * que conocer la escala clínica de antemano.
 */
export const NORWOOD_OPCIONES: { valor: string; nombre: string; descripcion: string }[] = [
  {
    valor: "norwood_2",
    nombre: "Grado II",
    descripcion: "Entradas iniciales en las sienes, forma de M o de pico de viuda leve",
  },
  {
    valor: "norwood_3",
    nombre: "Grado III",
    descripcion: "Entradas ya marcadas y profundas — el primer grado clínicamente significativo",
  },
  {
    valor: "norwood_3v",
    nombre: "Grado III vertex",
    descripcion: "Entradas marcadas, más una zona de pérdida ya visible en la coronilla",
  },
  {
    valor: "norwood_4",
    nombre: "Grado IV",
    descripcion: "Entradas y coronilla más extensas, separadas todavía por una franja de pelo",
  },
  {
    valor: "norwood_5",
    nombre: "Grado V",
    descripcion: "La franja que separa entradas y coronilla es ya estrecha y rala",
  },
  {
    valor: "norwood_6",
    nombre: "Grado VI",
    descripcion: "Entradas y coronilla ya conectadas, sin franja de separación",
  },
  {
    valor: "norwood_7",
    nombre: "Grado VII",
    descripcion: "Pérdida más avanzada — solo queda una franja de pelo lateral y trasera",
  },
  {
    valor: "no_seguro",
    nombre: "No estoy seguro",
    descripcion: "Prefiero que lo valoren a partir de mis fotos",
  },
];

/**
 * Escala de Ludwig (patrón femenino): adelgazamiento difuso de la
 * coronilla con la línea frontal generalmente conservada.
 */
export const LUDWIG_OPCIONES: { valor: string; nombre: string; descripcion: string }[] = [
  {
    valor: "ludwig_1",
    nombre: "Grado I",
    descripcion: "Adelgazamiento leve, la raya del pelo se ve algo más ancha de lo habitual",
  },
  {
    valor: "ludwig_2",
    nombre: "Grado II",
    descripcion: "Adelgazamiento moderado, se nota más cuero cabelludo en la parte alta",
  },
  {
    valor: "ludwig_3",
    nombre: "Grado III",
    descripcion: "Adelgazamiento severo, la coronilla se ve casi transparente",
  },
  {
    valor: "no_segura",
    nombre: "No estoy segura",
    descripcion: "Prefiero que lo valoren a partir de mis fotos",
  },
];

const NORWOOD_LABEL: Record<string, string> = Object.fromEntries(
  NORWOOD_OPCIONES.map((o) => [o.valor, o.nombre]),
);
const LUDWIG_LABEL: Record<string, string> = Object.fromEntries(
  LUDWIG_OPCIONES.map((o) => [o.valor, o.nombre]),
);

/** Etiqueta de "tipo de pérdida de cabello" según la escala que le toque por sexo. */
export function labelTipoPerdida(
  sexo: string | null,
  valor: string | null,
): string | null {
  if (!valor) return null;
  if (sexo === "mujer") return LUDWIG_LABEL[valor] ?? valor;
  return NORWOOD_LABEL[valor] ?? valor;
}

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
