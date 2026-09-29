/**
 * Tipos del informe capilar por flujo.
 *
 * La IA solo decide lo que se VE en las fotos (flujo, grado, zonas,
 * ángulo y calidad de cada foto). Todo el texto médico — tratamientos,
 * qué esperar, avisos — vive fijo en `flujos.ts`, así nunca se inventa
 * nada que no hayamos revisado.
 */

export const FLUJOS = [
  "alopecia_androgenetica_masculina",
  "alopecia_androgenetica_femenina",
  "efluvio_telogeno",
  "alopecia_areata",
  "alopecia_por_traccion",
  "cuero_cabelludo",
  "sin_signos",
] as const;
export type Flujo = (typeof FLUJOS)[number];

export const INTENSIDADES = ["conservada", "leve", "moderada", "marcada"] as const;
export type Intensidad = (typeof INTENSIDADES)[number];

export const ZONAS = ["entradas", "frontal", "media", "coronilla", "raya"] as const;
export type Zona = (typeof ZONAS)[number];

export const ANGULOS_FOTO = [
  "frontal",
  "coronilla",
  "donante",
  "perfil_derecho",
  "perfil_izquierdo",
  "raya",
  "otra",
] as const;
export type AnguloFoto = (typeof ANGULOS_FOTO)[number];

export const CALIDADES_FOTO = ["buena", "mejorable", "mala"] as const;
export type CalidadFoto = (typeof CALIDADES_FOTO)[number];

export const ESTADOS_DONANTE = ["buena", "media", "limitada", "no_valorable"] as const;
export type EstadoDonante = (typeof ESTADOS_DONANTE)[number];

export const CANDIDATO_INJERTO = ["si", "a_valorar", "no"] as const;
export type CandidatoInjerto = (typeof CANDIDATO_INJERTO)[number];

export type ObservacionFoto = {
  texto: string;
  /** Pinta el punto de color de la lista "Lo que vemos en tus fotos". */
  tono: Intensidad | "donante";
};

export type FotoInforme = {
  /** Ruta interna en el bucket privado (no una URL). */
  ruta: string;
  angulo: AnguloFoto;
  calidad: CalidadFoto;
};

/** Lo que se guarda en `estudios_capilares.informe` (jsonb). */
export type InformeCapilar = {
  version: 1;
  flujo: Flujo;
  /** Uno de los niveles de la escala del flujo (ver `flujos.ts`). */
  grado: string;
  /** Frase corta que acompaña al grado, sacada de lo que se ve. */
  detalle: string;
  zonas: Record<Zona, Intensidad>;
  zona_donante: EstadoDonante;
  /** Solo alopecia areata: número de placas visibles. */
  placas: number | null;
  /** Solo alopecia androgenética masculina. */
  candidato_injerto: CandidatoInjerto | null;
  observaciones: ObservacionFoto[];
  fotos: FotoInforme[];
};
