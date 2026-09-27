import { rangoUfsPorNorwood } from "@/lib/ai/rango-ufs";
import type { Flujo, InformeCapilar } from "./tipos";

/**
 * Contenido fijo de cada uno de los 7 informes. La IA elige el flujo y
 * describe lo que se ve; todo lo que hay aquí (tratamientos, plazos,
 * avisos) está escrito y revisado a mano, nunca generado.
 *
 * Regla: el informe se ve ANTES del formulario de presupuesto, así que
 * ningún texto puede dar por hecho algo que el paciente no nos ha
 * contado (causas, antecedentes, cuándo empezó…).
 */

export type Tono = "ok" | "aviso" | "neutro";

export type PasoLinea = { t: string; when: string; aqui?: boolean };

export type Metrica = {
  label: string;
  valor: string;
  unidad: string;
  nota: string;
  /** Barra 0–5.000 UF (en %), solo injerto. */
  barra?: { left: number; width: number };
  linea?: PasoLinea[];
};

export type Tile = {
  label: string;
  valor: string;
  nota: string;
  tono?: Tono;
  /** Medidor de 4 segmentos (zona donante). */
  medidor?: number;
};

export type Tratamiento = {
  nombre: string;
  tipo: string;
  porque: string;
  sesiones: string;
  top?: boolean;
};

export type ContenidoFlujo = {
  etiqueta: string;
  titulo: (nombre: string | null) => string;
  intro: string;
  escala: {
    nombre: string;
    sub: string;
    niveles: readonly string[];
    resultado: (ia: InformeCapilar) => string;
  };
  mostrarDonante: boolean;
  significa: string[];
  tratTitulo: string;
  tratamientos: (ia: InformeCapilar) => Tratamiento[];
  rec: {
    tag: (ia: InformeCapilar) => string;
    chip: string;
    titulo: string;
    sub: string;
    metrica: (ia: InformeCapilar) => Metrica;
    tiles: (ia: InformeCapilar) => Tile[];
    pregunta: string;
    boton: string;
  };
  esperar: { titulo: string; pasos: { when: string; what: string }[] };
  cta: { titulo: string; boton: string };
  match: { texto: (n: number) => string; boton: string };
  /** Técnicas del catálogo (clinic-options) para el Match Score previo. */
  tecnicas: string[];
};

function conNombre(nombre: string | null, resto: string): string {
  return nombre?.trim()
    ? `${nombre.trim()}, ${resto}`
    : resto.charAt(0).toUpperCase() + resto.slice(1);
}

const clinicas = (n: number, que: string) =>
  `Hemos encontrado ${n} ${n === 1 ? "clínica" : "clínicas"} ${que}.`;

const TRATAMIENTOS_POSIBLES_TOPICO_INYECTABLE: Tile = {
  label: "Tratamientos posibles",
  valor: "Tópicos o inyectables",
  nota: "Minoxidil, mesoterapia o PRP. Mejor que los paute un médico.",
};

export const CONTENIDO_FLUJOS: Record<Flujo, ContenidoFlujo> = {
  alopecia_androgenetica_masculina: {
    etiqueta: "Alopecia androgenética masculina",
    titulo: (n) =>
      conNombre(n, "tus fotos muestran un patrón compatible con alopecia androgenética masculina"),
    intro:
      "Es la caída más habitual en hombres. Tiene tratamiento y hay varias opciones. Te contamos qué vemos y qué puedes hacer.",
    escala: {
      nombre: "Escala Norwood",
      sub: "alopecia masculina",
      niveles: ["I", "II", "III", "IV", "V", "VI", "VII"],
      resultado: (ia) => `Tu grado estimado: Norwood ${ia.grado}`,
    },
    mostrarDonante: true,
    significa: [
      "La alopecia androgenética avanza poco a poco: el pelo de las entradas y la coronilla se hace más fino hasta dejar de crecer. El de la nuca no se ve afectado, y por eso sirve para un injerto.",
      "Cuanto antes se actúe, más pelo propio se conserva. Hay tratamientos para frenar la caída y, si hace falta, para recuperar densidad.",
    ],
    tratTitulo: "Posibles tratamientos",
    tratamientos: (ia) => {
      const injertoTop = ia.candidato_injerto !== "no";
      return [
        {
          nombre: "Injerto capilar FUE",
          tipo: "Cirugía",
          top: injertoTop,
          porque: "Recupera entradas y coronilla con tu propio pelo, si la zona donante lo permite.",
          sesiones: "1 intervención",
        },
        {
          nombre: "Tratamiento médico",
          tipo: "Tópico u oral",
          top: !injertoTop,
          porque:
            "Minoxidil o finasterida para frenar la caída del pelo que conservas. Siempre con receta y pauta médica.",
          sesiones: "Continuo",
        },
        {
          nombre: "PRP capilar",
          tipo: "Inyectable",
          porque: "Refuerza el pelo existente y ayuda a la recuperación tras un injerto.",
          sesiones: "3–4 + mantenimiento",
        },
      ];
    },
    rec: {
      tag: (ia) => (ia.candidato_injerto === "no" ? "Tratamiento médico" : "Injerto capilar FUE"),
      chip: "Injerto",
      titulo: "Tu valoración para injerto capilar",
      sub: "Orientativa. La clínica la confirma en la valoración presencial.",
      metrica: (ia) => {
        const rango = rangoUfsPorNorwood(`Norwood ${ia.grado}`);
        if (!rango) {
          return {
            label: "Folículos estimados",
            valor: "No aplica",
            unidad: "con este grado no suele plantearse injerto",
            nota: "Con una pérdida tan leve se suele empezar por frenar la caída.",
          };
        }
        // toLocaleString("es-ES") no separa los miles con 4 cifras (1200).
        const fmt = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
        return {
          label: "Folículos estimados",
          valor: `${fmt(rango.desde)} – ${fmt(rango.hasta)}`,
          unidad: "unidades foliculares (UF)",
          nota: `Referencia habitual para un Norwood ${ia.grado}. La cifra exacta solo se sabe en consulta.`,
          barra: {
            left: (rango.desde / 5000) * 100,
            width: ((rango.hasta - rango.desde) / 5000) * 100,
          },
        };
      },
      tiles: (ia) => {
        const donante: Record<string, Tile> = {
          buena: { label: "Zona donante", valor: "Buena", medidor: 3, nota: "Densidad suficiente para cubrir lo que necesitas sin agotarla." },
          media: { label: "Zona donante", valor: "Media", medidor: 2, nota: "Permite un injerto, pero hay que repartir bien los folículos." },
          limitada: { label: "Zona donante", valor: "Limitada", medidor: 1, tono: "aviso", nota: "Puede limitar cuánto se puede cubrir. Lo valora la clínica." },
          no_valorable: { label: "Zona donante", valor: "Sin valorar", tono: "aviso", nota: "Sube una foto de la nuca para poder valorarla." },
        };
        const candidato: Record<string, Tile> = {
          si: { label: "¿Candidato a injerto?", valor: "Sí, a confirmar", tono: "ok", nota: "Conviene frenar la caída con tratamiento médico antes y después." },
          a_valorar: { label: "¿Candidato a injerto?", valor: "A valorar", nota: "Depende de la zona donante y de cómo evolucione la caída." },
          no: { label: "¿Candidato a injerto?", valor: "Ahora no", tono: "aviso", nota: "Lo primero sería frenar la caída con tratamiento médico." },
        };
        return [donante[ia.zona_donante], candidato[ia.candidato_injerto ?? "a_valorar"]];
      },
      pregunta: "¿Cuánto costaría en tu caso?",
      boton: "Pedir presupuesto a 5 clínicas",
    },
    esperar: {
      titulo: "Qué esperar tras un injerto",
      pasos: [
        { when: "Día 0", what: "Intervención, en una sola jornada" },
        { when: "Semana 2", what: "Caen las costras y vuelves a tu rutina" },
        { when: "Mes 1–2", what: "Se cae el pelo implantado. Es normal" },
        { when: "Mes 3–4", what: "Empieza a crecer el pelo nuevo" },
        { when: "Mes 6", what: "Cambio claramente visible" },
        { when: "Mes 12", what: "Resultado final" },
      ],
    },
    cta: { titulo: "Recibe hasta 5 presupuestos de clínicas que encajan contigo", boton: "Solicitar presupuesto" },
    match: { texto: (n) => clinicas(n, "que se ajustan a tu caso"), boton: "Pedir presupuesto" },
    tecnicas: ["Injerto FUE", "Injerto DHI", "Injerto sin afeitado", "Minoxidil", "Finasteride / Dutasteride", "PRP"],
  },

  alopecia_androgenetica_femenina: {
    etiqueta: "Alopecia androgenética femenina",
    titulo: (n) =>
      conNombre(n, "tus fotos muestran un patrón compatible con alopecia androgenética femenina"),
    intro:
      "Es la causa más frecuente de pérdida de densidad en mujeres. No se recupera sola, pero se puede frenar y mejorar con tratamiento, sobre todo si se empieza pronto.",
    escala: {
      nombre: "Escala Ludwig",
      sub: "alopecia femenina",
      niveles: ["I", "II", "III"],
      resultado: (ia) => `Tu grado estimado: Ludwig ${ia.grado}`,
    },
    mostrarDonante: false,
    significa: [
      "La alopecia androgenética femenina se nota como una raya cada vez más ancha y menos volumen en la parte de arriba, sin llegar a zonas calvas. Influyen la genética y las hormonas, y es habitual que aumente con los años.",
      "El pelo afectado se hace más fino poco a poco. Con tratamiento se puede frenar ese proceso y recuperar parte de la densidad, por eso conviene no esperar.",
    ],
    tratTitulo: "Posibles tratamientos",
    tratamientos: () => [
      { nombre: "Consulta tricológica y analítica", tipo: "Consulta", top: true, porque: "Descarta déficits como hierro o tiroides y pauta el tratamiento adecuado para ti.", sesiones: "1 consulta + analítica" },
      { nombre: "Tratamiento tópico", tipo: "Tópico", porque: "El minoxidil es el más habitual: frena la caída y mejora el grosor. Siempre con pauta médica.", sesiones: "Diario, a largo plazo" },
      { nombre: "PRP o mesoterapia", tipo: "Inyectable", porque: "Infiltraciones que estimulan el folículo, como refuerzo del tratamiento tópico.", sesiones: "3–4 + mantenimiento" },
    ],
    rec: {
      tag: () => "Consulta tricológica",
      chip: "Alopecia femenina",
      titulo: "Tu valoración",
      sub: "Orientativa. El especialista la confirma en consulta.",
      metrica: () => ({
        label: "Plan orientativo",
        valor: "6–12 meses",
        unidad: "para ver resultados con tratamiento",
        nota: "Es un tratamiento de fondo: los cambios llegan despacio, pero se mantienen mientras se sigue la pauta.",
        linea: [
          { t: "Consulta y analítica", when: "Mes 0", aqui: true },
          { t: "Tratamiento tópico o inyectable", when: "Mes 1–4" },
          { t: "Revisión", when: "Mes 6" },
          { t: "Mantenimiento", when: "Mes 12" },
        ],
      }),
      tiles: () => [
        { label: "Evolución", valor: "Tratable", tono: "ok", nota: "Se puede frenar y ganar densidad. Cuanto antes, mejor." },
        { ...TRATAMIENTOS_POSIBLES_TOPICO_INYECTABLE, nota: "Minoxidil, PRP o mesoterapia. Mejor que los paute un médico." },
        { label: "¿Injerto?", valor: "Poco probable", tono: "aviso", nota: "Solo en casos concretos. Lo valora el especialista." },
      ],
      pregunta: "¿Qué te propondría cada clínica?",
      boton: "Pedir consulta a 5 clínicas",
    },
    esperar: {
      titulo: "Qué esperar con el tratamiento",
      pasos: [
        { when: "Mes 0", what: "Consulta, analítica y pauta" },
        { when: "Mes 1–2", what: "Puede haber algo más de caída al empezar. Es normal" },
        { when: "Mes 3–4", what: "La caída se estabiliza" },
        { when: "Mes 6", what: "Más grosor y volumen en la zona superior" },
        { when: "Mes 12", what: "Mejora de densidad visible" },
      ],
    },
    cta: { titulo: "Pide consulta a las 5 clínicas que mejor encajan contigo", boton: "Solicitar consulta" },
    match: { texto: (n) => clinicas(n, "con tratamientos para alopecia femenina"), boton: "Pedir consulta" },
    tecnicas: ["Consulta tricológica", "Analítica capilar", "Minoxidil", "PRP", "Mesoterapia capilar"],
  },

  efluvio_telogeno: {
    etiqueta: "Efluvio telógeno",
    titulo: (n) => conNombre(n, "tus fotos muestran un patrón compatible con efluvio telógeno"),
    intro:
      "Es una caída repartida por toda la cabeza, sin zonas calvas. En la mayoría de los casos es temporal, pero conviene que un médico confirme la causa.",
    escala: {
      nombre: "Intensidad de la caída",
      sub: "efluvio",
      niveles: ["Leve", "Moderada", "Intensa"],
      resultado: (ia) => `Pérdida de densidad difusa ${ia.grado.toLowerCase()}`,
    },
    mostrarDonante: false,
    significa: [
      "En el efluvio, muchos pelos pasan a la vez a su fase de reposo y se caen unas semanas después. Suele aparecer 2–3 meses después de algo que ha alterado el cuerpo: un parto, estrés, una dieta estricta, una enfermedad o un déficit de hierro, entre otras causas.",
      "El folículo no se pierde, así que el pelo suele volver a crecer. Por eso lo importante es que un médico encuentre la causa y confirme que no hay una alopecia de base.",
    ],
    tratTitulo: "Posibles tratamientos",
    tratamientos: () => [
      { nombre: "Consulta médica y analítica", tipo: "Consulta", top: true, porque: "Busca la causa (hierro, tiroides, vitamina D…) y descarta otras alopecias. Es el primer paso.", sesiones: "1 consulta + analítica" },
      { nombre: "Tratamiento tópico", tipo: "Tópico", porque: "Lociones como el minoxidil pueden acelerar la recuperación. Siempre con pauta médica.", sesiones: "Diario, 3–6 meses" },
      { nombre: "Mesoterapia o PRP", tipo: "Inyectable", porque: "Infiltraciones en el cuero cabelludo para estimular el folículo si la caída se alarga.", sesiones: "3–6 sesiones" },
    ],
    rec: {
      tag: () => "Consulta médica",
      chip: "Efluvio",
      titulo: "Tu valoración",
      sub: "Orientativa. El médico la confirma en consulta.",
      metrica: () => ({
        label: "Plan orientativo",
        valor: "3–6 meses",
        unidad: "para notar que la caída se frena",
        nota: "El efluvio suele recuperarse cuando se corrige la causa. El tratamiento de apoyo ayuda a que sea más rápido.",
        linea: [
          { t: "Consulta y analítica", when: "Mes 0", aqui: true },
          { t: "Tratar la causa", when: "Mes 0–1" },
          { t: "Tratamiento de apoyo", when: "Mes 1–4" },
          { t: "Revisión", when: "Mes 6" },
        ],
      }),
      tiles: () => [
        { label: "¿Suele ser temporal?", valor: "Sí, casi siempre", tono: "ok", nota: "Si pasados 6 meses sigue igual, puede haber otra causa." },
        TRATAMIENTOS_POSIBLES_TOPICO_INYECTABLE,
        { label: "¿Injerto?", valor: "No indicado", tono: "aviso", nota: "El pelo suele recuperarse. Un injerto no tiene sentido aquí." },
      ],
      pregunta: "¿Quieres saber qué la está causando?",
      boton: "Pedir consulta a 5 clínicas",
    },
    esperar: {
      titulo: "Qué esperar en los próximos meses",
      pasos: [
        { when: "Al principio", what: "La caída aparece de golpe y repartida" },
        { when: "Mes 1–3", what: "Consulta, analítica y se trata la causa" },
        { when: "Mes 3–6", what: "La caída se frena poco a poco" },
        { when: "Mes 6–9", what: "Pelo nuevo, corto, en la raya" },
        { when: "Mes 12", what: "Densidad recuperada en la mayoría de los casos" },
      ],
    },
    cta: { titulo: "Pide consulta a las 5 clínicas que mejor encajan contigo", boton: "Solicitar consulta" },
    match: { texto: (n) => clinicas(n, "con consulta capilar que se ajustan a tu caso"), boton: "Pedir consulta" },
    tecnicas: ["Consulta tricológica", "Analítica capilar", "Minoxidil", "Mesoterapia capilar", "PRP"],
  },

  alopecia_areata: {
    etiqueta: "Alopecia areata",
    titulo: (n) => conNombre(n, "tus fotos muestran un patrón compatible con alopecia areata"),
    intro:
      "Son zonas redondas sin pelo que aparecen de forma repentina. El folículo no se destruye, así que el pelo puede volver a crecer. Tiene tratamiento, y responde mejor si se empieza pronto.",
    escala: {
      nombre: "Extensión",
      sub: "alopecia areata",
      niveles: ["Placa única", "Varias placas", "Extensa"],
      resultado: (ia) =>
        ia.placas ? `${ia.placas} ${ia.placas === 1 ? "placa detectada" : "placas detectadas"}` : ia.grado,
    },
    mostrarDonante: false,
    significa: [
      "La alopecia areata ocurre porque el sistema inmunitario ataca por error al folículo. El pelo cae en zonas redondas de bordes muy definidos, a veces de un día para otro.",
      "Muchas placas se recuperan, solas o con tratamiento, aunque pueden aparecer otras. Hay tratamientos que funcionan bien, pero el que te conviene depende de tu caso y debe pautarlo un dermatólogo. No se trata con injerto.",
    ],
    tratTitulo: "Posibles tratamientos",
    tratamientos: () => [
      { nombre: "Consulta con dermatología", tipo: "Consulta", top: true, porque: "Confirma el diagnóstico y elige el tratamiento según el número y tamaño de las placas.", sesiones: "1 consulta" },
      { nombre: "Tratamiento tópico", tipo: "Tópico", porque: "Cremas o lociones con corticoide y, a veces, minoxidil como apoyo. Con pauta médica.", sesiones: "Diario, según pauta" },
      { nombre: "Infiltraciones", tipo: "Inyectable", porque: "Pequeñas inyecciones de corticoide en la placa. Las aplica el dermatólogo en consulta.", sesiones: "Cada 4–6 semanas" },
    ],
    rec: {
      tag: () => "Consulta con dermatología",
      chip: "Areata",
      titulo: "Tu valoración",
      sub: "Orientativa. El dermatólogo la confirma en consulta.",
      metrica: () => ({
        label: "Plan orientativo",
        valor: "3–6 meses",
        unidad: "para ver repoblarse las placas",
        nota: "Hazles una foto cada mes con la misma luz: te ayudará a ti y al especialista a ver cómo evolucionan.",
        linea: [
          { t: "Consulta con dermatología", when: "Semana 1–2", aqui: true },
          { t: "Tópico o infiltraciones", when: "Mes 1" },
          { t: "Revisión", when: "Mes 3" },
          { t: "Seguimiento", when: "Mes 6" },
        ],
      }),
      tiles: () => [
        { label: "¿Se recupera?", valor: "Es posible", tono: "ok", nota: "Muchas placas se repueblan solas o con tratamiento." },
        { label: "Tratamientos posibles", valor: "Tópicos o infiltraciones", nota: "Corticoides en crema o infiltrados en la placa. Siempre con pauta médica." },
        { label: "¿Injerto?", valor: "No indicado", tono: "aviso", nota: "En la areata el problema no es la falta de folículos." },
      ],
      pregunta: "¿Quieres que lo vea un especialista?",
      boton: "Pedir cita a 5 clínicas",
    },
    esperar: {
      titulo: "Qué esperar con el tratamiento",
      pasos: [
        { when: "Semana 1–2", what: "Consulta con dermatología y diagnóstico" },
        { when: "Mes 1", what: "Empiezas el tratamiento pautado" },
        { when: "Mes 2–3", what: "Primeros pelos finos en la placa, a veces claros" },
        { when: "Mes 6", what: "La placa se va repoblando" },
        { when: "Siempre", what: "Si aparece una placa nueva, avisa al especialista" },
      ],
    },
    cta: { titulo: "Pide cita a las 5 clínicas que mejor encajan contigo", boton: "Solicitar cita" },
    match: { texto: (n) => clinicas(n, "con consulta capilar cerca de ti"), boton: "Pedir cita" },
    tecnicas: ["Consulta tricológica", "Analítica capilar"],
  },

  alopecia_por_traccion: {
    etiqueta: "Alopecia por tracción",
    titulo: (n) => conNombre(n, "tus fotos muestran un patrón compatible con alopecia por tracción"),
    intro:
      "Es la pérdida típica del pelo que pasa mucho tiempo tirante, por coletas, moños, trenzas o extensiones. Si se quita la tensión a tiempo, lo normal es que se recupere.",
    escala: {
      nombre: "Fase",
      sub: "alopecia por tracción",
      niveles: ["Inicial", "Avanzada"],
      resultado: (ia) => `Fase ${ia.grado.toLowerCase()}`,
    },
    mostrarDonante: true,
    significa: [
      "Cuando el pelo está tirante un día tras otro, la tensión acaba dañando el folículo. Por eso la pérdida empieza en el borde de la frente y en las sienes, que es donde más tiran los recogidos.",
      "En fase inicial, el pelo suele volver si se deja de tirar de él. Si la tensión se mantiene durante años, la pérdida puede hacerse permanente. Un especialista puede confirmarlo y ayudarte a acelerar la recuperación.",
    ],
    tratTitulo: "Posibles tratamientos",
    tratamientos: () => [
      { nombre: "Consulta tricológica", tipo: "Consulta", top: true, porque: "Confirma la causa y te dice cómo proteger el pelo mientras se recupera.", sesiones: "1 consulta" },
      { nombre: "Tratamiento tópico", tipo: "Tópico", porque: "El minoxidil puede ayudar a recuperar el borde y las sienes. Siempre con pauta médica.", sesiones: "Diario, 6–12 meses" },
      { nombre: "Mesoterapia o PRP", tipo: "Inyectable", porque: "Infiltraciones que fortalecen el pelo de las zonas afectadas durante la recuperación.", sesiones: "4–6 sesiones" },
    ],
    rec: {
      tag: () => "Consulta tricológica",
      chip: "Tracción",
      titulo: "Tu valoración",
      sub: "Orientativa. El especialista la confirma en consulta.",
      metrica: () => ({
        label: "Plan orientativo",
        valor: "6–12 meses",
        unidad: "para recuperar el borde sin tensión",
        nota: "Lo que más ayuda es alternar peinados sueltos y evitar gomas y extensiones que tiren.",
        linea: [
          { t: "Soltar los peinados", when: "Desde hoy", aqui: true },
          { t: "Consulta", when: "Mes 0–1" },
          { t: "Tratamiento de apoyo", when: "Mes 1–6" },
          { t: "Revisión", when: "Mes 6" },
        ],
      }),
      tiles: (ia) => [
        ia.grado === "Avanzada"
          ? { label: "¿Reversible?", valor: "En parte", tono: "aviso", nota: "En fase avanzada puede quedar pérdida permanente." }
          : { label: "¿Reversible?", valor: "Probablemente", tono: "ok", nota: "En fase inicial el pelo suele volver en unos meses sin tensión." },
        TRATAMIENTOS_POSIBLES_TOPICO_INYECTABLE,
        ia.grado === "Avanzada"
          ? { label: "¿Injerto?", valor: "A valorar", nota: "Si la pérdida es permanente, un injerto puede ser una opción." }
          : { label: "¿Injerto?", valor: "No ahora", tono: "aviso", nota: "Solo tendría sentido si la pérdida se volviera permanente." },
      ],
      pregunta: "¿Quieres que lo confirme un especialista?",
      boton: "Pedir consulta a 5 clínicas",
    },
    esperar: {
      titulo: "Qué esperar si quitas la tensión",
      pasos: [
        { when: "Desde hoy", what: "Peinados sueltos y sin gomas apretadas" },
        { when: "Mes 1–3", what: "El borde deja de retroceder" },
        { when: "Mes 3–6", what: "Pelo nuevo y fino en las sienes" },
        { when: "Mes 6–12", what: "Densidad recuperada en la mayoría de fases iniciales" },
      ],
    },
    cta: { titulo: "Pide consulta a las 5 clínicas que mejor encajan contigo", boton: "Solicitar consulta" },
    match: { texto: (n) => clinicas(n, "con consulta capilar que se ajustan a tu caso"), boton: "Pedir consulta" },
    tecnicas: ["Consulta tricológica", "Minoxidil", "Mesoterapia capilar", "PRP"],
  },

  cuero_cabelludo: {
    etiqueta: "Cuero cabelludo irritado",
    titulo: (n) => conNombre(n, "tus fotos muestran descamación y rojez en el cuero cabelludo"),
    intro:
      "No vemos pérdida de pelo importante, pero sí un cuero cabelludo irritado. Es muy frecuente, tiene tratamiento y conviene cuidarlo, porque la inflamación mantenida debilita el pelo.",
    escala: {
      nombre: "Intensidad",
      sub: "cuero cabelludo",
      niveles: ["Leve", "Moderada", "Intensa"],
      resultado: (ia) => `Irritación ${ia.grado.toLowerCase()}`,
    },
    mostrarDonante: false,
    significa: [
      "La descamación con rojez suele deberse a un problema del propio cuero cabelludo, como la dermatitis seborreica. Es muy frecuente, no es contagiosa y va por brotes: puede empeorar con el estrés, el frío o algunos productos.",
      "Un cuero cabelludo irritado durante mucho tiempo puede aumentar la caída. Tratarlo primero es la base para cualquier otro tratamiento capilar.",
    ],
    tratTitulo: "Posibles tratamientos",
    tratamientos: () => [
      { nombre: "Consulta tricológica", tipo: "Consulta", top: true, porque: "Identifica la causa exacta de la irritación y pauta el tratamiento.", sesiones: "1 consulta" },
      { nombre: "Champús y lociones medicados", tipo: "Tópico", porque: "Antifúngicos o antiinflamatorios suaves, según la causa. Con pauta médica.", sesiones: "Según pauta" },
      { nombre: "Tratamiento en cabina", tipo: "En clínica", porque: "Limpieza y tratamientos calmantes en clínica, como apoyo.", sesiones: "4–6 sesiones" },
    ],
    rec: {
      tag: () => "Consulta tricológica",
      chip: "Cuero cabelludo",
      titulo: "Tu valoración",
      sub: "Orientativa. El especialista la confirma en consulta.",
      metrica: () => ({
        label: "Plan orientativo",
        valor: "2–4 semanas",
        unidad: "para notar menos picor y escamas",
        nota: "Hasta la consulta, evita rascarte y los productos agresivos.",
        linea: [
          { t: "Consulta", when: "Semana 1", aqui: true },
          { t: "Tratamiento tópico", when: "Semana 1–4" },
          { t: "Revisión", when: "Mes 2" },
          { t: "Mantenimiento", when: "Después" },
        ],
      }),
      tiles: () => [
        { label: "¿Afecta a la caída?", valor: "Puede", tono: "aviso", nota: "La inflamación mantenida debilita el pelo." },
        { label: "Tratamientos posibles", valor: "Tópicos", nota: "Champús y lociones medicados. Mejor que los paute un médico." },
        { label: "¿Contagioso?", valor: "No", tono: "ok", nota: "No se transmite a otras personas." },
      ],
      pregunta: "¿Quieres saber qué lo causa?",
      boton: "Pedir consulta a 5 clínicas",
    },
    esperar: {
      titulo: "Qué esperar con el tratamiento",
      pasos: [
        { when: "Semana 1", what: "Consulta y diagnóstico" },
        { when: "Semana 2–4", what: "Menos picor y menos escamas" },
        { when: "Mes 2–3", what: "Cuero cabelludo estable" },
        { when: "Después", what: "Mantenimiento para evitar nuevos brotes" },
      ],
    },
    cta: { titulo: "Pide consulta a las 5 clínicas que mejor encajan contigo", boton: "Solicitar consulta" },
    match: { texto: (n) => clinicas(n, "con tricología que se ajustan a tu caso"), boton: "Pedir consulta" },
    tecnicas: ["Consulta tricológica", "Analítica capilar"],
  },

  sin_signos: {
    etiqueta: "Sin signos claros",
    titulo: (n) => conNombre(n, "en tus fotos no vemos signos claros de pérdida de pelo"),
    intro:
      "Tu densidad es normal en las zonas que hemos podido ver. Aun así, si notas cambios o hay calvicie en tu familia, tiene sentido tener un punto de partida.",
    escala: {
      nombre: "Resultado",
      sub: "sin signos claros",
      niveles: ["Sin signos", "Signos leves", "Pérdida clara"],
      resultado: (ia) => (ia.grado === "Signos leves" ? "Signos muy leves" : "Densidad normal"),
    },
    mostrarDonante: false,
    significa: [
      "Perder entre 50 y 100 pelos al día es normal, y hay épocas, como el otoño, en las que se nota más. En tus fotos la densidad es buena.",
      "Si notas que la caída va a más, o hay antecedentes de calvicie en tu familia, una revisión con un especialista te dará tranquilidad y una referencia para comparar en el futuro.",
    ],
    tratTitulo: "Qué puedes hacer",
    tratamientos: () => [
      { nombre: "Revisión capilar preventiva", tipo: "Consulta", top: true, porque: "Un especialista mide tu densidad y te da un punto de partida para comparar en el futuro.", sesiones: "1 consulta" },
      { nombre: "Repetir el análisis", tipo: "En casa", porque: "Haz las mismas fotos, con la misma luz, dentro de 6 meses y compara.", sesiones: "Cada 6 meses" },
      { nombre: "Cuidar los hábitos", tipo: "En casa", porque: "Comer variado, dormir bien y controlar el estrés también cuentan para la salud del pelo.", sesiones: "Siempre" },
    ],
    rec: {
      tag: () => "Revisión preventiva",
      chip: "Sin signos",
      titulo: "Tu valoración",
      sub: "Orientativa. Si notas cambios, un especialista puede confirmarlo.",
      metrica: () => ({
        label: "Resultado",
        valor: "Sin signos claros",
        unidad: "de pérdida de pelo",
        nota: "Es una foto de hoy. Si más adelante notas cambios, podrás comparar con este informe.",
      }),
      tiles: () => [
        { label: "¿Necesitas tratamiento?", valor: "Ahora no", tono: "ok", nota: "No vemos nada que tratar en tus fotos." },
        { label: "¿Revisión?", valor: "Opcional", nota: "Recomendable si hay calvicie en tu familia." },
        { label: "Próximo análisis", valor: "En 6 meses", nota: "Con las mismas fotos, para poder comparar." },
      ],
      pregunta: "¿Quieres quedarte tranquilo?",
      boton: "Pedir revisión a 5 clínicas",
    },
    esperar: {
      titulo: "Cómo seguir tu pelo",
      pasos: [
        { when: "Hoy", what: "Este informe es tu punto de partida" },
        { when: "Mes 6", what: "Repite el análisis con la misma luz" },
        { when: "Mes 12", what: "Compara con hoy" },
        { when: "Si notas cambios", what: "Pide una revisión con un especialista" },
      ],
    },
    cta: { titulo: "Pide una revisión a las 5 clínicas que mejor encajan contigo", boton: "Solicitar revisión" },
    match: { texto: (n) => clinicas(n, "que hacen revisiones capilares cerca de ti"), boton: "Pedir revisión" },
    tecnicas: ["Consulta tricológica"],
  },
};
