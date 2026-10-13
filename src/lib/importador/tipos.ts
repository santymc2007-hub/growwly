// Tipos compartidos entre el servidor (análisis/guardado) y la pantalla
// de revisión del importador de clínicas (/admin/clinicas/importar).

export type DiaHorario = {
  dia: string;
  abierto: boolean;
  desde: string;
  hasta: string;
};

/** Una ficha candidata de Google Maps para la clínica buscada. */
export type CandidatoGoogle = {
  placeId: string;
  nombre: string;
  direccion: string;
  telefono: string | null;
  web: string | null;
  lat: number | null;
  lng: number | null;
  rating: number | null;
  totalResenas: number | null;
  mapsUri: string | null;
  /** Municipio ya emparejado con la tabla `municipios` (null si no casa). */
  ciudad: string | null;
  provincia: string | null;
  horariosEstructurados: DiaHorario[];
  /** Texto legible de Google ("lunes: 9:00–14:00, 16:00–20:00"...). */
  horariosTexto: string | null;
  accesibilidadChecks: string[];
};

/** Lo que se ha podido sacar de la web de la clínica. */
export type DatosWeb = {
  urlFinal: string;
  titulo: string | null;
  descripcion: string | null;
  telefono: string | null;
  email: string | null;
  direccion: string | null;
  /** Técnicas ya traducidas al catálogo de Growwly. */
  tecnicas: string[];
  /** Tratamientos que aparecen en la web pero no encajan en el catálogo. */
  tratamientosSinClasificar: string[];
  idiomas: string[];
  financiacion: boolean | null;
  primeraConsultaGratis: boolean | null;
  oferta: string | null;
  precios: string | null;
  redes: Record<"instagram" | "facebook" | "tiktok" | "linkedin", string | null>;
  logos: string[];
  fotos: FotoCandidata[];
};

export type FotoCandidata = {
  url: string;
  /** Viene de un banco de imágenes (AdobeStock, Shutterstock...): no es foto real de la clínica. */
  stock: boolean;
};

export type ClinicaExistente = {
  id: string;
  nombre: string;
  motivo: string;
};

export type PropuestaImportacion = {
  web: DatosWeb | null;
  errorWeb: string | null;
  google: CandidatoGoogle[];
  errorGoogle: string | null;
  /** Fichas de Growwly que parecen ser la misma clínica (solo en modo "nueva"). */
  existentes: ClinicaExistente[];
  nombreBuscado: string;
};

export type ResultadoAnalisis =
  | { ok: true; propuesta: PropuestaImportacion }
  | { ok: false; error: string };
