/** Lo que devuelve /api/buscador (compartido entre servidor y cliente). */

export type FilaComparativa = {
  id: string;
  etiqueta: string;
  /** Si el usuario lo pidió (se resalta). */
  pedida: boolean;
};

export type ClinicaResultado = {
  id: string;
  nombre: string;
  ciudad: string | null;
  href: string;
  foto: string | null;
  rating: number | null;
  resenas: number | null;
  mejor: boolean;
  encaja: string[];
  dudas: string[];
  /** Valor de cada fila comparativa (id → texto). */
  valores: Record<string, string>;
};

export type RespuestaBuscador = {
  titulo: string;
  texto: string;
  nota: string | null;
  recomendadas: ClinicaResultado[];
  descartadas: { nombre: string; motivo: string }[];
  filas: FilaComparativa[];
};
