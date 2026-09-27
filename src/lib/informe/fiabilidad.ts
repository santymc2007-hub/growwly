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

/**
 * Ángulos que pedimos para cada flujo. Donde la nuca no aporta nada
 * (alopecia femenina, efluvio, cuero cabelludo) se pide la raya central.
 */
function angulosRecomendados(flujo: Flujo): AnguloFoto[] {
  const conRaya =
    flujo === "alopecia_androgenetica_femenina" ||
    flujo === "efluvio_telogeno" ||
    flujo === "cuero_cabelludo";
  return ["frontal", conRaya ? "raya" : "donante", "coronilla", "perfil_derecho", "perfil_izquierdo"];
}

export type NivelFiabilidad = "Baja" | "Media" | "Alta";

export type Fiabilidad = {
  nivel: NivelFiabilidad;
  cubiertos: number;
  total: number;
  calidad: "Buena" | "Mejorable" | "Mala";
  faltan: AnguloFoto[];
  texto: string;
};

/**
 * Fiabilidad del informe: solo depende de las fotos (cuántos de los
 * ángulos recomendados hay y con qué calidad). No usa nada del
 * formulario, porque el informe se ve antes de rellenarlo.
 */
export function calcularFiabilidad(informe: InformeCapilar): Fiabilidad {
  const recomendados = angulosRecomendados(informe.flujo);
  const utiles = informe.fotos.filter((f) => f.calidad !== "mala");
  const cubiertosSet = new Set(utiles.map((f) => f.angulo));
  const faltan = recomendados.filter((a) => !cubiertosSet.has(a));
  const cubiertos = recomendados.length - faltan.length;

  const malas = informe.fotos.filter((f) => f.calidad === "mala").length;
  const buenas = informe.fotos.filter((f) => f.calidad === "buena").length;
  const calidad: Fiabilidad["calidad"] =
    malas > informe.fotos.length / 2 ? "Mala" : buenas === informe.fotos.length ? "Buena" : "Mejorable";

  let nivel: NivelFiabilidad = cubiertos >= 4 ? "Alta" : cubiertos >= 2 ? "Media" : "Baja";
  if (calidad === "Mejorable" && nivel === "Alta") nivel = "Media";
  if (calidad === "Mala") nivel = "Baja";

  const texto =
    nivel === "Alta"
      ? "Tienes casi todas las fotos que pedimos y con buena calidad. Es lo máximo que podemos afinar sin una consulta."
      : calidad !== "Buena"
        ? "Algunas fotos tienen poca luz o no se ve bien el cuero cabelludo. Con fotos más claras el informe sería más preciso."
        : `Más fotos y de mejor calidad, informe más preciso. Te faltan ${faltan.length} de los ángulos que pedimos.`;

  return { nivel, cubiertos, total: recomendados.length, calidad, faltan, texto };
}
