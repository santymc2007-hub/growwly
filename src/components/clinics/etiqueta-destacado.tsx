/**
 * Etiqueta "Destacado" sobre la foto de las tarjetas que salen arriba
 * porque la clínica paga visibilidad (destacado general o de
 * provincia). La exige la Directiva Ómnibus de consumo: el paciente
 * tiene que saber cuándo una posición está pagada.
 * Explicación completa en /como-ordenamos.
 */
export function EtiquetaDestacado() {
  return (
    <span
      title="Este centro paga para aparecer entre los primeros. Más en «Cómo ordenamos»."
      className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-0.5 text-[11px] font-medium text-ink-soft shadow-sm"
    >
      Destacado
    </span>
  );
}
