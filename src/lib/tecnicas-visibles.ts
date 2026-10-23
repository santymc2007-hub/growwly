/**
 * Nombre con el que se ENSEÑA una técnica en listados, tarjetas, menús,
 * buscador y pie de página. El valor guardado (clinics.tecnicas,
 * tratamientos.nombre) no cambia: filtros, emparejamiento de leads y la
 * propia página del tratamiento siguen usando el nombre real.
 *
 * Motivo: Google Ads rechaza los anuncios cuya página de destino
 * menciona medicamentos con receta (RESTRICTED_DRUG_TERMS en España). El
 * menú y el pie salen en todas las páginas, así que basta con que el
 * nombre aparezca ahí para que cualquier destino quede rechazado.
 */
const NOMBRES_VISIBLES: Record<string, string> = {
  "Finasteride / Dutasteride": "Tratamiento oral anticaída",
};

export function nombreVisibleTecnica(tecnica: string): string {
  return NOMBRES_VISIBLES[tecnica] ?? tecnica;
}

/**
 * Lo contrario, para leer un filtro ?tecnica= que llega con el nombre
 * visible. Si llega con el valor real (enlaces antiguos), se deja igual.
 */
export function tecnicaDesdeParametro(valor: string): string {
  const real = Object.entries(NOMBRES_VISIBLES).find(([, visible]) => visible === valor)?.[0];
  return real ?? valor;
}
