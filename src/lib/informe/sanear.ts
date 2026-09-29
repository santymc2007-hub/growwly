import { CONTENIDO_FLUJOS } from "./flujos";
import {
  ANGULOS_FOTO,
  CALIDADES_FOTO,
  CANDIDATO_INJERTO,
  ESTADOS_DONANTE,
  FLUJOS,
  INTENSIDADES,
  ZONAS,
  type AnguloFoto,
  type CalidadFoto,
  type InformeCapilar,
  type Intensidad,
  type ObservacionFoto,
  type Zona,
} from "./tipos";

/** El informe tal cual sale de la IA: las rutas se añaden al guardarlo. */
export type InformeSinRutas = Omit<InformeCapilar, "fotos"> & {
  fotos: { angulo: AnguloFoto; calidad: CalidadFoto }[];
};

function uno<T extends string>(valor: unknown, validos: readonly T[], porDefecto: T): T {
  return typeof valor === "string" && (validos as readonly string[]).includes(valor)
    ? (valor as T)
    : porDefecto;
}

function texto(valor: unknown, max: number): string {
  return typeof valor === "string" ? valor.trim().slice(0, max) : "";
}

/**
 * Convierte la respuesta de la IA en un informe válido. Nunca confía en
 * ella: cualquier valor fuera de las listas permitidas cae a un valor
 * neutro, para que un JSON raro no rompa la página del informe.
 */
export function sanearRespuestaIA(
  raw: unknown,
  numFotos: number,
): { informe: InformeSinRutas; resultadoTexto: string } {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;

  const flujo = uno(r.flujo, FLUJOS, "sin_signos");
  const niveles = CONTENIDO_FLUJOS[flujo].escala.niveles;
  const grado =
    typeof r.grado === "string" && niveles.includes(r.grado.trim())
      ? r.grado.trim()
      : flujo === "sin_signos"
        ? niveles[0]
        : niveles[Math.floor((niveles.length - 1) / 2)];

  const zonasRaw = (r.zonas && typeof r.zonas === "object" ? r.zonas : {}) as Record<string, unknown>;
  const zonas = Object.fromEntries(
    ZONAS.map((z) => [z, uno(zonasRaw[z], INTENSIDADES, "conservada")]),
  ) as Record<Zona, Intensidad>;

  const placasNum = Number(r.placas);
  const placas =
    flujo === "alopecia_areata" && Number.isFinite(placasNum) && placasNum > 0
      ? Math.min(20, Math.round(placasNum))
      : null;

  const candidato_injerto =
    flujo === "alopecia_androgenetica_masculina"
      ? uno(r.candidato_injerto, CANDIDATO_INJERTO, "a_valorar")
      : null;

  const observaciones: ObservacionFoto[] = (Array.isArray(r.observaciones) ? r.observaciones : [])
    .map((o) => {
      const obj = (o && typeof o === "object" ? o : {}) as Record<string, unknown>;
      return {
        texto: texto(obj.texto, 80),
        tono: uno(obj.tono, [...INTENSIDADES, "donante"] as const, "conservada"),
      };
    })
    .filter((o) => o.texto)
    .slice(0, 5);

  // Una entrada por foto enviada, en el mismo orden. Si la IA se salta
  // alguna, se rellena como "otra" / "mejorable" en vez de descuadrar
  // qué ruta corresponde a qué foto.
  const fotosRaw = Array.isArray(r.fotos) ? r.fotos : [];
  const porIndice = new Map<number, Record<string, unknown>>();
  fotosRaw.forEach((f, i) => {
    const obj = (f && typeof f === "object" ? f : {}) as Record<string, unknown>;
    const idx = Number(obj.indice);
    porIndice.set(Number.isFinite(idx) ? idx : i + 1, obj);
  });
  const fotos = Array.from({ length: numFotos }, (_, i) => {
    const obj = porIndice.get(i + 1) ?? {};
    return {
      angulo: uno(obj.angulo, ANGULOS_FOTO, "otra"),
      calidad: uno(obj.calidad, CALIDADES_FOTO, "mejorable"),
    };
  });

  return {
    informe: {
      version: 1,
      flujo,
      grado,
      detalle: texto(r.detalle, 140),
      zonas,
      zona_donante: uno(r.zona_donante, ESTADOS_DONANTE, "no_valorable"),
      placas,
      candidato_injerto,
      observaciones,
      fotos,
    },
    resultadoTexto: texto(r.resultado_texto, 1200),
  };
}

/** Lee `estudios_capilares.informe` (jsonb) con la misma desconfianza. */
export function leerInforme(json: unknown): InformeCapilar | null {
  if (!json || typeof json !== "object") return null;
  const j = json as Record<string, unknown>;
  if (j.version !== 1 || !(FLUJOS as readonly string[]).includes(String(j.flujo))) return null;
  const rutas = (Array.isArray(j.fotos) ? j.fotos : []).map((f) =>
    f && typeof f === "object" ? String((f as Record<string, unknown>).ruta ?? "") : "",
  );
  const { informe } = sanearRespuestaIA(j, rutas.length);
  return {
    ...informe,
    fotos: informe.fotos.map((f, i) => ({ ...f, ruta: rutas[i] })).filter((f) => f.ruta),
  };
}
