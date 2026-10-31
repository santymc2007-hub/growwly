export type PasoId = "frontal" | "perfil1" | "perfil2" | "coronilla" | "nuca";
export type ModoCoronilla = "ayuda" | "solo";

export type Paso = {
  id: PasoId;
  nombre: string;
  /** Nombre del archivo que se envía (sin extensión). */
  archivo: string;
  camara: "user" | "environment";
  tipo: "frente" | "perfil" | "libre";
};

export const PASOS: Paso[] = [
  { id: "frontal", nombre: "Frontal", archivo: "frontal", camara: "user", tipo: "frente" },
  { id: "perfil1", nombre: "Perfil", archivo: "perfil-1", camara: "user", tipo: "perfil" },
  { id: "perfil2", nombre: "Otro perfil", archivo: "perfil-2", camara: "user", tipo: "perfil" },
  { id: "coronilla", nombre: "Coronilla", archivo: "coronilla", camara: "user", tipo: "libre" },
  { id: "nuca", nombre: "Nuca", archivo: "nuca", camara: "user", tipo: "libre" },
];

export const TITULO_PASO: Record<PasoId, string> = {
  frontal: "De frente",
  perfil1: "Perfil",
  perfil2: "El otro perfil",
  coronilla: "Coronilla",
  nuca: "Nuca",
};

/** Lo que se dice en voz alta (modo "solo") y se muestra (modo "ayuda") al empezar cada paso libre. */
export const INSTRUCCION_LIBRE: Record<"coronilla" | "nuca", Record<ModoCoronilla, { texto: string; sub: string; voz?: string }>> = {
  coronilla: {
    ayuda: {
      texto: "Apunta a la coronilla desde arriba",
      sub: "A un palmo de la cabeza, que se vea toda la coronilla. La foto se hace sola.",
    },
    solo: {
      texto: "Sube el móvil por encima de la cabeza",
      sub: "Con la pantalla mirando hacia tu cabeza. Te avisamos con la voz.",
      voz: "Sube el móvil por encima de la cabeza, con la pantalla mirando hacia tu coronilla. Cuando te quedes quieto, hago la foto.",
    },
  },
  nuca: {
    ayuda: {
      texto: "Ahora la nuca, desde detrás",
      sub: "A un palmo, que se vea la zona entre las dos orejas. La foto se hace sola.",
    },
    solo: {
      texto: "Pon el móvil detrás de la cabeza",
      sub: "A la altura de la nuca, a un palmo, con la pantalla mirando hacia tu nuca.",
      voz: "Ahora la nuca. Pon el móvil detrás de la cabeza, a la altura de la nuca y a un palmo, con la pantalla mirando hacia tu nuca. Quédate quieto.",
    },
  },
};
