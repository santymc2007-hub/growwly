export const TECNICAS_DISPONIBLES = [
  "Injerto FUE",
  "Injerto DHI",
  "Injerto FUT",
  "Injerto sin afeitado",
  "Mesoterapia capilar",
  "PRP",
  "Micropigmentación capilar",
] as const;

export const IDIOMAS_DISPONIBLES = [
  "Español",
  "Inglés",
  "Francés",
  "Alemán",
  "Italiano",
  "Árabe",
  "Euskera",
] as const;

// 0€, 500€, 1.000€ ... 10.000€
export const PRECIO_OPCIONES: number[] = Array.from(
  { length: 21 },
  (_, i) => i * 500,
);

export function formatearPrecio(valor: number): string {
  return `${valor.toLocaleString("es-ES")}€`;
}
