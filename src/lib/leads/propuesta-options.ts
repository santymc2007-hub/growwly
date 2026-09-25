export const TIPO_PRECIO_LABEL: Record<string, string> = {
  cerrado: "Precio cerrado",
  desde: "Desde",
  rango: "Rango estimado",
  valoracion: "Necesita valoración previa",
};

export const TIPO_CONSULTA_LABEL: Record<string, string> = {
  presencial: "Presencial",
  videollamada: "Videollamada",
  ambas: "Ambas",
};

/** Tal cual la plantilla del documento — clave interna + etiqueta visible. */
export const INCLUYE_OPCIONES: { clave: string; etiqueta: string }[] = [
  { clave: "intervencion", etiqueta: "Intervención" },
  { clave: "valoracion_medica", etiqueta: "Valoración médica" },
  { clave: "medicacion", etiqueta: "Medicación postoperatoria" },
  { clave: "prp", etiqueta: "PRP" },
  { clave: "revisiones", etiqueta: "Revisiones" },
  { clave: "hotel", etiqueta: "Hotel" },
  { clave: "traslado", etiqueta: "Traslado" },
];

export function etiquetaIncluye(clave: string): string {
  return INCLUYE_OPCIONES.find((o) => o.clave === clave)?.etiqueta ?? clave;
}

/**
 * Texto del precio ya formateado para mostrar — la misma lógica sirve
 * tanto para la clínica (revisar lo que envió) como para el paciente
 * (Fase 5, cuando pueda ver la propuesta).
 */
export function formatearPrecioPropuesta(propuesta: {
  tipo_precio: string;
  precio_min: number | null;
  precio_max: number | null;
}): string {
  // Postgres devuelve las columnas "numeric" como string vía PostgREST
  // (para no perder precisión), aunque el tipo generado diga `number`.
  const fmt = (n: number) => `${Number(n).toLocaleString("es-ES")} €`;
  switch (propuesta.tipo_precio) {
    case "cerrado":
      return propuesta.precio_min != null ? fmt(propuesta.precio_min) : "Precio cerrado";
    case "desde":
      return propuesta.precio_min != null ? `Desde ${fmt(propuesta.precio_min)}` : "Desde";
    case "rango":
      return propuesta.precio_min != null && propuesta.precio_max != null
        ? `${fmt(propuesta.precio_min)} – ${fmt(propuesta.precio_max)}`
        : "Rango estimado";
    default:
      return "Necesita valoración previa";
  }
}
