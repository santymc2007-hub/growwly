/**
 * Palabras clave del buscador con IA: las que se ven en gris debajo del
 * campo y se encienden cuando el usuario las nombra (y que se añaden al
 * texto al tocarlas). La detección es local, en el navegador, para que
 * sea instantánea; la IA interpreta el texto completo al buscar.
 * Sin dependencias de servidor: lo usan el cliente y la API.
 */

export type PalabraClave = {
  id: string;
  texto: string;
  /** Sobre el texto en minúsculas y sin tildes. */
  re: RegExp;
  /** Lo que se añade al texto al tocarla. */
  frase: string;
  principal?: boolean;
};

export const PALABRAS_CLAVE: PalabraClave[] = [
  { id: "precio", texto: "Precio", re: /precio|barat|economic|presupuesto|€|euros|\d{3,}\s*e\b/, frase: ", con buen precio", principal: true },
  { id: "financiacion", texto: "Financiación", re: /financ|plazos|cuotas|a meses/, frase: ", que se pueda financiar", principal: true },
  { id: "ubicacion", texto: "Cerca de mí", re: /palma|mallorca|inca|manacor|alcudia|llucmajor|calvia|marratxi|felanitx|soller|pollensa|cerca/, frase: ", cerca de mí", principal: true },
  { id: "parking", texto: "Parking", re: /parking|aparca/, frase: ", con parking", principal: true },
  { id: "tecnica", texto: "Técnica avanzada", re: /avanzad|\bdhi\b|zafiro|ultima tecnica|\bfue\b|sin afeitar|sin rasurar/, frase: ", con las técnicas más avanzadas", principal: true },
  { id: "medico", texto: "Lo opera un médico", re: /medico|cirujano|doctor/, frase: ", que lo haga un médico", principal: true },
  { id: "revisiones", texto: "Revisiones incluidas", re: /revision|seguimiento/, frase: ", con revisiones incluidas", principal: true },
  { id: "garantia", texto: "Garantía", re: /garantia/, frase: ", con garantía de resultado", principal: true },
  { id: "consulta", texto: "1.ª consulta gratis", re: /consulta gratis|primera consulta|consulta gratuita/, frase: ", con primera consulta gratis", principal: true },
  { id: "opiniones", texto: "Buenas opiniones", re: /opinion|resena|valorad|antes y despues|recomendad/, frase: ", con buenas opiniones", principal: true },
  { id: "habitacion", texto: "Habitación privada", re: /habitacion|privad|intimidad/, frase: ", con habitación privada", principal: true },
  { id: "dolor", texto: "Sin dolor", re: /dolor|sedacion|anestesia/, frase: ", sin dolor", principal: true },
  { id: "comida", texto: "Comida incluida", re: /comida|almuerzo/, frase: ", con comida incluida" },
  { id: "acompanante", texto: "Ir acompañado", re: /acompan/, frase: ", que pueda ir acompañado" },
  { id: "lavado", texto: "Primer lavado", re: /lavado/, frase: ", con el primer lavado en la clínica" },
  { id: "corte", texto: "Primer corte de pelo", re: /corte de pelo|primer corte/, frase: ", con el primer corte de pelo" },
  { id: "prppost", texto: "PRP post incluido", re: /prp post|postinjerto|post injerto/, frase: ", con PRP postinjerto incluido" },
  { id: "whatsapp", texto: "Seguimiento por WhatsApp", re: /whatsapp/, frase: ", con seguimiento por WhatsApp" },
  { id: "acceso", texto: "Accesible", re: /ascensor|silla de ruedas|accesib|movilidad reducida/, frase: ", accesible en silla de ruedas" },
  { id: "transporte", texto: "Transporte público", re: /autobus|\bbus\b|metro|\btren\b|transporte/, frase: ", bien comunicada en transporte público" },
  { id: "tarde", texto: "Horario de tarde", re: /por la tarde|horario de tarde|tardes/, frase: ", con horario de tarde" },
  { id: "sabado", texto: "Sábados", re: /sabado|fin de semana/, frase: ", que abra los sábados" },
  { id: "idiomas", texto: "Idiomas", re: /ingles|aleman|frances|idioma|english/, frase: ", que hablen inglés" },
  { id: "video", texto: "Videoconsulta", re: /videoconsulta|videollamada|online/, frase: ", con videoconsulta" },
];

const ZONAS = ["palma", "mallorca", "inca", "manacor", "alcudia", "llucmajor", "calvia", "marratxi", "felanitx", "soller", "pollensa"];

export function normalizar(t: string): string {
  return (t || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

export type Deteccion = {
  tratamiento: "injerto" | "prp" | "mesoterapia" | "micropigmentacion" | "consulta" | null;
  /** Presupuesto máximo en euros, si lo dice. */
  tope: number | null;
  zona: string | null;
  tecnica: string | null;
  activas: string[];
};

export function detectar(texto: string): Deteccion {
  const s = normalizar(texto);
  const m = s.match(/(\d[\d.\s]{2,})\s*(€|eur|euros|e\b)/);
  const tope = m ? parseInt(m[1].replace(/[.\s]/g, ""), 10) || null : null;
  const zona = ZONAS.find((z) => s.includes(z)) ?? null;

  let tecnica: string | null = null;
  if (/\bdhi\b/.test(s)) tecnica = "DHI";
  else if (/zafiro/.test(s)) tecnica = "FUE con zafiro";
  else if (/sin afeitar|sin rasurar/.test(s)) tecnica = "Sin afeitar";
  else if (/avanzad|ultima tecnica/.test(s)) tecnica = "Las más avanzadas";
  else if (/\bfue\b/.test(s)) tecnica = "FUE";

  let tratamiento: Deteccion["tratamiento"] = null;
  if (/injerto|trasplante|implante/.test(s)) tratamiento = "injerto";
  else if (/\bprp\b|plasma/.test(s)) tratamiento = "prp";
  else if (/mesoterapia/.test(s)) tratamiento = "mesoterapia";
  else if (/micropigment/.test(s)) tratamiento = "micropigmentacion";
  else if (/tricolog|caida|alopecia|diagnostico/.test(s)) tratamiento = "consulta";

  return {
    tratamiento,
    tope,
    zona,
    tecnica,
    activas: PALABRAS_CLAVE.filter((p) => p.re.test(s)).map((p) => p.id),
  };
}

export const NOMBRE_TRATAMIENTO: Record<NonNullable<Deteccion["tratamiento"]>, string> = {
  injerto: "Injerto capilar",
  prp: "PRP",
  mesoterapia: "Mesoterapia",
  micropigmentacion: "Micropigmentación",
  consulta: "Consulta tricológica",
};

/** Texto que muestra una palabra encendida (con el dato concreto si lo hay). */
export function textoPalabra(p: PalabraClave, d: Deteccion): string {
  if (p.id === "precio" && d.tope) return `Hasta ${d.tope.toLocaleString("es-ES")} €`;
  if (p.id === "ubicacion" && d.zona) return d.zona.charAt(0).toUpperCase() + d.zona.slice(1);
  if (p.id === "tecnica" && d.tecnica) return d.tecnica;
  return p.texto;
}

export const EJEMPLOS_BUSQUEDA = [
  "Busco hacerme un injerto en Palma, pero no quiero que supere los 4000€ y que sea de las técnicas más avanzadas",
  "Quiero hacerme PRP en Mallorca pero no sé cuál es mejor",
  "Injerto en Palma con parking y habitación privada, que se pueda financiar",
];
