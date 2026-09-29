import type { AnguloFoto, Flujo, InformeCapilar } from "./tipos";

export const ETIQUETA_ANGULO: Record<AnguloFoto, string> = {
  frontal: "Frontal",
  coronilla: "Coronilla",
  donante: "Nuca · zona donante",
  perfil_derecho: "Perfil derecho",
  perfil_izquierdo: "Perfil izquierdo",
  raya: "Raya central",
  otra: "Otra vista",
};

type ZonaFoto = { etiqueta: string; angulos: AnguloFoto[] };

/**
 * Zonas que pedimos fotografiar. Los dos perfiles cuentan como una sola
 * zona (entradas / laterales): con uno de los dos ya se ve bien el
 * patrón. Donde la nuca no aporta nada (alopecia femenina, efluvio,
 * cuero cabelludo) se pide la raya central.
 */
function zonasRecomendadas(flujo: Flujo): ZonaFoto[] {
  const conRaya =
    flujo === "alopecia_androgenetica_femenina" ||
    flujo === "efluvio_telogeno" ||
    flujo === "cuero_cabelludo";
  return [
    { etiqueta: "Frontal", angulos: ["frontal"] },
    { etiqueta: "Entradas · perfil", angulos: ["perfil_derecho", "perfil_izquierdo"] },
    { etiqueta: "Coronilla", angulos: ["coronilla"] },
    conRaya
      ? { etiqueta: "Raya central", angulos: ["raya"] }
      : { etiqueta: "Nuca · zona donante", angulos: ["donante"] },
  ];
}

export type NivelFiabilidad = "Baja" | "Media" | "Alta";

export type Fiabilidad = {
  nivel: NivelFiabilidad;
  /** Zonas recomendadas con al menos una foto aprovechable. */
  cubiertas: number;
  totalZonas: number;
  /** Fotos que se ven bien, sobre el total enviado. */
  fotosBuenas: number;
  totalFotos: number;
  calidad: "Buena" | "Mejorable" | "Mala";
  /** Etiquetas de las zonas que faltan. */
  faltan: string[];
  texto: string;
};

/**
 * Fiabilidad del informe: solo depende de las fotos (qué zonas se ven y
 * con qué calidad). No usa nada del formulario, porque el informe se ve
 * antes de rellenarlo.
 */
export function calcularFiabilidad(informe: InformeCapilar): Fiabilidad {
  const zonas = zonasRecomendadas(informe.flujo);
  const angulosUtiles = new Set(
    informe.fotos.filter((f) => f.calidad !== "mala").map((f) => f.angulo),
  );
  const faltan = zonas
    .filter((z) => !z.angulos.some((a) => angulosUtiles.has(a)))
    .map((z) => z.etiqueta);
  const cubiertas = zonas.length - faltan.length;

  const totalFotos = informe.fotos.length;
  const fotosBuenas = informe.fotos.filter((f) => f.calidad === "buena").length;
  const malas = informe.fotos.filter((f) => f.calidad === "mala").length;
  // Buena si al menos 2 de cada 3 fotos se ven bien: una foto regular
  // entre varias buenas no debe bajar la fiabilidad de todo el informe.
  const calidad: Fiabilidad["calidad"] =
    malas > totalFotos / 2 ? "Mala" : fotosBuenas >= (totalFotos * 2) / 3 ? "Buena" : "Mejorable";

  let nivel: NivelFiabilidad = cubiertas >= 4 ? "Alta" : cubiertas >= 2 ? "Media" : "Baja";
  if (calidad === "Mejorable" && nivel === "Alta") nivel = "Media";
  if (calidad === "Mala") nivel = "Baja";

  const listaFaltan = faltan.map((f) => f.toLowerCase()).join(" y ");
  const texto =
    nivel === "Alta"
      ? "Tienes fotos de todas las zonas que pedimos y con buena calidad. Es lo máximo que podemos afinar sin una consulta."
      : calidad !== "Buena"
        ? "Algunas fotos tienen poca luz o no se ve bien el cuero cabelludo. Con fotos más claras el informe sería más preciso."
        : `Te falta ${faltan.length === 1 ? "la zona" : "las zonas"} ${listaFaltan}. Con ${faltan.length === 1 ? "esa foto" : "esas fotos"} el informe sería más preciso.`;

  return { nivel, cubiertas, totalZonas: zonas.length, fotosBuenas, totalFotos, calidad, faltan, texto };
}
