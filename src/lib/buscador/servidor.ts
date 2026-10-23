import { createAdminClient } from "@/lib/supabase/admin";
import { hrefFicha } from "@/lib/seo/landings";
import {
  etiquetaFinanciacion,
  etiquetaParking,
  etiquetaQuienOpera,
  parsearFilasPrecio,
  rangoDeFila,
  textoRango,
  type FilaPrecio,
} from "@/lib/clinica/comparables";
import { detectar, NOMBRE_TRATAMIENTO, normalizar, type Deteccion } from "./palabras";
import type { ClinicaResultado, FilaComparativa, RespuestaBuscador } from "./tipos";

/**
 * Buscador con IA: elige candidatas con reglas (rápido y barato) y le
 * pide a la IA que redacte el porqué y escoja 2–3 entre ellas. Solo usa
 * datos públicos de las fichas; los precios ocultos sirven para encajar
 * pero nunca se enseña la cifra. El plan (Premium o no) no puntúa.
 */

type Perfil = {
  id: string;
  nombre: string;
  ciudad: string | null;
  href: string;
  foto: string | null;
  rating: number | null;
  resenas: number | null;
  tecnicas: string[];
  tratamientos: string[];
  precios: FilaPrecio[];
  financiacion: string | null;
  parking: string | null;
  quienOpera: string | null;
  revisiones: number | null;
  seguimiento: number | null;
  garantia: boolean | null;
  consultaGratis: boolean;
  videoconsulta: boolean;
  idiomas: string[];
  accesible: boolean;
  ventajas: string[];
};

const PATRON_TRATAMIENTO: Record<NonNullable<Deteccion["tratamiento"]>, RegExp> = {
  injerto: /injerto|trasplante|\bfue\b|\bdhi\b|\bfut\b/,
  prp: /\bprp\b|plasma/,
  mesoterapia: /mesoterapia/,
  micropigmentacion: /micropigment/,
  consulta: /tricolog|consulta|diagnost|analitica/,
};

async function cargarPerfiles(): Promise<Perfil[]> {
  const admin = createAdminClient();
  const [{ data: clinicas }, { data: precios }, { data: marcas }, { data: ventajas }] =
    await Promise.all([
      admin
        .from("clinics")
        .select(
          "id, nombre, slug, ciudad, provincia, fotos, logo_url, rating_google, resenas_google, tecnicas, servicios_adicionales, financiacion_tipo, financiacion, parking, quien_opera, revisiones_num, seguimiento_meses, garantia, primera_consulta_gratis, acepta_videoconsulta, idiomas, accesibilidad_checks",
        )
        .eq("publicado", true),
      admin
        .from("clinic_precios")
        .select("clinic_id, tratamiento, modalidad, desde, hasta, norwood, nota, visible, orden")
        .order("orden"),
      admin.from("clinic_ventajas").select("clinic_id, ventaja_id"),
      admin.from("ventajas").select("id, nombre").eq("estado", "aprobada"),
    ]);

  const nombreVentaja = new Map((ventajas ?? []).map((v) => [v.id, v.nombre]));
  return (clinicas ?? []).map((c) => {
    const filas = parsearFilasPrecio(
      JSON.stringify((precios ?? []).filter((p) => p.clinic_id === c.id)),
    );
    return {
      id: c.id,
      nombre: c.nombre,
      ciudad: c.ciudad,
      href: hrefFicha(c),
      foto: c.fotos?.[0] ?? c.logo_url ?? null,
      rating: c.rating_google !== null ? Number(c.rating_google) : null,
      resenas: c.resenas_google,
      tecnicas: c.tecnicas ?? [],
      tratamientos: Array.from(new Set([...filas.map((f) => f.tratamiento), ...(c.servicios_adicionales ?? [])])),
      precios: filas,
      financiacion: c.financiacion_tipo ?? (c.financiacion ? "si" : null),
      parking: c.parking,
      quienOpera: c.quien_opera,
      revisiones: c.revisiones_num,
      seguimiento: c.seguimiento_meses,
      garantia: c.garantia,
      consultaGratis: c.primera_consulta_gratis,
      videoconsulta: c.acepta_videoconsulta,
      idiomas: c.idiomas ?? [],
      accesible: (c.accesibilidad_checks ?? []).length > 0,
      ventajas: (marcas ?? [])
        .filter((m) => m.clinic_id === c.id)
        .map((m) => nombreVentaja.get(m.ventaja_id))
        .filter((n): n is string => Boolean(n)),
    };
  });
}

function haceTratamiento(p: Perfil, t: Deteccion["tratamiento"]): boolean {
  if (!t) return true;
  const re = PATRON_TRATAMIENTO[t];
  return [...p.tecnicas, ...p.tratamientos].some((x) => re.test(normalizar(x)));
}

/** Rango de precio del tratamiento buscado (o del primero con precio). */
function precioDe(p: Perfil, t: Deteccion["tratamiento"]) {
  const re = t ? PATRON_TRATAMIENTO[t] : null;
  const filas = p.precios.filter((f) => !re || re.test(normalizar(f.tratamiento)));
  const conCifras = filas.filter((f) => rangoDeFila(f).desde !== null || rangoDeFila(f).hasta !== null);
  if (!conCifras.length) return null;
  const visibles = conCifras.filter((f) => f.visible);
  const r = conCifras.map(rangoDeFila);
  const desde = Math.min(...r.map((x) => x.desde ?? x.hasta ?? Infinity));
  const hasta = Math.max(...r.map((x) => x.hasta ?? x.desde ?? 0));
  return { desde, hasta, visible: visibles.length > 0, filas: visibles.length ? visibles : conCifras };
}

function cumple(p: Perfil, id: string): boolean | null {
  const v = new Set(p.ventajas.map(normalizar));
  const tiene = (patron: RegExp) => [...v].some((x) => patron.test(x));
  switch (id) {
    case "financiacion": return p.financiacion ? p.financiacion !== "no" : null;
    case "parking": return p.parking ? p.parking !== "no" : null;
    case "medico": return p.quienOpera ? p.quienOpera === "medico" : null;
    case "revisiones": return p.revisiones || p.seguimiento ? true : null;
    case "garantia": return p.garantia;
    case "consulta": return p.consultaGratis || null;
    case "opiniones": return p.rating !== null ? p.rating >= 4.5 && (p.resenas ?? 0) >= 20 : null;
    case "habitacion": return tiene(/habitacion/) || null;
    case "dolor": return tiene(/dolor|sedacion/) || null;
    case "comida": return tiene(/comida/) || null;
    case "acompanante": return tiene(/acompan/) || null;
    case "lavado": return tiene(/lavado/) || null;
    case "corte": return tiene(/corte/) || null;
    case "prppost": return tiene(/prp/) || null;
    case "whatsapp": return tiene(/whatsapp/) || null;
    case "acceso": return p.accesible || tiene(/ascensor/) || null;
    case "transporte": return tiene(/transporte/) || null;
    case "tarde": return tiene(/tarde/) || null;
    case "sabado": return tiene(/sabado/) || null;
    case "idiomas": return p.idiomas.length > 1 || null;
    case "video": return p.videoconsulta || null;
    default: return null;
  }
}

function puntuar(p: Perfil, d: Deteccion): number {
  let s = 0;
  if (d.tratamiento) s += haceTratamiento(p, d.tratamiento) ? 6 : -20;
  if (d.zona && d.zona !== "mallorca" && p.ciudad) s += normalizar(p.ciudad).includes(d.zona) ? 3 : 0;
  if (d.tope) {
    const pr = precioDe(p, d.tratamiento);
    if (pr) s += pr.desde <= d.tope ? 4 : -6;
  }
  if (d.tecnica && d.tecnica !== "Las más avanzadas") {
    s += p.tecnicas.some((t) => normalizar(t).includes(normalizar(d.tecnica!.split(" ")[0]))) ? 2 : 0;
  } else if (d.tecnica) {
    s += p.tecnicas.some((t) => /dhi|zafiro|sin afeitar/i.test(t)) ? 2 : 0;
  }
  for (const id of d.activas) {
    const c = cumple(p, id);
    if (c === true) s += 1.5;
    else if (c === false) s -= 1;
  }
  s += (p.rating ?? 4) * 0.6 + Math.min(1, (p.resenas ?? 0) / 200);
  return s;
}

const FILAS: { id: string; etiqueta: string; palabras: string[] }[] = [
  { id: "precio", etiqueta: "Precio orientativo", palabras: ["precio"] },
  { id: "tecnicas", etiqueta: "Técnicas", palabras: ["tecnica"] },
  { id: "ubicacion", etiqueta: "Ubicación", palabras: ["ubicacion"] },
  { id: "parking", etiqueta: "Parking", palabras: ["parking"] },
  { id: "financiacion", etiqueta: "Financiación", palabras: ["financiacion"] },
  { id: "medico", etiqueta: "Quién hace el injerto", palabras: ["medico"] },
  { id: "revisiones", etiqueta: "Revisiones", palabras: ["revisiones"] },
  { id: "garantia", etiqueta: "Garantía", palabras: ["garantia"] },
  { id: "consulta", etiqueta: "Primera consulta", palabras: ["consulta"] },
  { id: "opiniones", etiqueta: "Opiniones en Google", palabras: ["opiniones"] },
  { id: "idiomas", etiqueta: "Idiomas", palabras: ["idiomas"] },
  { id: "extras", etiqueta: "Además ofrece", palabras: ["habitacion", "dolor", "comida", "acompanante", "lavado", "corte", "prppost", "whatsapp"] },
];

const NO_INDICA = "No lo indica";

function valoresDe(p: Perfil, d: Deteccion): Record<string, string> {
  const pr = precioDe(p, d.tratamiento);
  let precio = NO_INDICA;
  if (pr && pr.visible) {
    precio = textoRango(pr.desde, pr.hasta === pr.desde ? null : pr.hasta) ?? NO_INDICA;
    if (d.tope) precio += pr.desde <= d.tope ? " · dentro de tu presupuesto" : " · por encima de tu presupuesto";
  } else if (pr && d.tope) {
    precio = pr.desde <= d.tope ? "Encaja con tu presupuesto (según la clínica)" : "Por encima de tu presupuesto (según la clínica)";
  }
  const revisiones = [
    p.revisiones ? `${p.revisiones === 5 ? "5 o más" : p.revisiones} revisiones` : null,
    p.seguimiento ? `${p.seguimiento} meses` : null,
  ].filter(Boolean).join(" · ");
  return {
    precio,
    tecnicas: p.tecnicas.length ? p.tecnicas.slice(0, 4).join(", ") : NO_INDICA,
    ubicacion: p.ciudad ?? NO_INDICA,
    parking: etiquetaParking(p.parking) ?? NO_INDICA,
    financiacion: etiquetaFinanciacion(p.financiacion) ?? NO_INDICA,
    medico: etiquetaQuienOpera(p.quienOpera) ?? NO_INDICA,
    revisiones: revisiones || NO_INDICA,
    garantia: p.garantia === null ? NO_INDICA : p.garantia ? "Sí" : "No",
    consulta: p.consultaGratis ? "Gratis" : NO_INDICA,
    opiniones: p.rating !== null ? `★ ${p.rating.toLocaleString("es-ES")} · ${p.resenas ?? 0} reseñas` : NO_INDICA,
    idiomas: p.idiomas.length ? p.idiomas.join(", ") : NO_INDICA,
    extras: p.ventajas.length ? p.ventajas.slice(0, 4).join(" · ") : "—",
  };
}

/** Lo que se le pasa a la IA de cada candidata (sin cifras ocultas). */
function resumenParaIA(p: Perfil, d: Deteccion) {
  const pr = precioDe(p, d.tratamiento);
  return {
    id: p.id,
    nombre: p.nombre,
    ciudad: p.ciudad,
    tecnicas: p.tecnicas,
    tratamientos: p.tratamientos.slice(0, 8),
    precio_tratamiento_buscado: pr
      ? pr.visible
        ? textoRango(pr.desde, pr.hasta)
        : d.tope
          ? pr.desde <= d.tope
            ? "OCULTO, pero encaja con el presupuesto del usuario"
            : "OCULTO, y supera el presupuesto del usuario"
          : "OCULTO (no revelar)"
      : "no lo indica",
    precios_visibles: p.precios
      .filter((f) => f.visible)
      .slice(0, 6)
      .map((f) => ({
        tratamiento: f.tratamiento,
        precio: f.modalidad === "norwood"
          ? Object.entries(f.norwood ?? {}).map(([t, r]) => `Norwood ${t}: ${textoRango(r?.desde ?? null, r?.hasta ?? null)}`).join("; ")
          : textoRango(f.desde, f.hasta),
        nota: f.nota,
      })),
    financiacion: etiquetaFinanciacion(p.financiacion),
    parking: etiquetaParking(p.parking),
    quien_hace_injerto: etiquetaQuienOpera(p.quienOpera),
    revisiones: p.revisiones,
    seguimiento_meses: p.seguimiento,
    garantia: p.garantia,
    primera_consulta_gratis: p.consultaGratis,
    videoconsulta: p.videoconsulta,
    idiomas: p.idiomas,
    valoracion_google: p.rating !== null ? { nota: p.rating, resenas: p.resenas } : null,
    ademas_ofrece: p.ventajas,
  };
}

const SISTEMA = `Eres el asesor de Growwly, un directorio de clínicas capilares en España. Un paciente describe lo que busca y tú le recomiendas, de las clínicas candidatas que te paso, las 2 (como mucho 3) que mejor encajan, y le explicas por qué en un tono cercano, claro y honesto.

Reglas:
- Usa SOLO los datos de las candidatas. No inventes precios, técnicas, servicios ni opiniones. Si una clínica no indica algo que el paciente pidió, dilo ("no indica si tiene parking").
- Si un precio pone "OCULTO", nunca des ni insinúes una cifra: como mucho, "encaja con tu presupuesto según la clínica".
- Si una clínica supera claramente el presupuesto o no hace el tratamiento, no la recomiendes; puedes nombrarla en "descartadas" con el motivo (como mucho 2). Que no indique un dato NO es motivo para descartarla: si no la recomiendas por eso, simplemente no la nombres.
- Si ninguna encaja del todo, dilo con honestidad y recomienda las más cercanas explicando qué les falta.
- Neutral: no eres comercial de ninguna clínica. No es un consejo médico: no diagnostiques ni prometas resultados.
- Español de España, frases naturales, sin tecnicismos innecesarios, sin emojis, sin superlativos vacíos.

Responde SOLO con este JSON (sin backticks):
{"titulo": "una frase corta, p. ej. 'Te encajan 2 clínicas en Palma'",
 "texto": "2 o 3 frases con el porqué, nombrando las clínicas en **negrita** (máx. 60 palabras)",
 "nota": "una frase de consejo práctico o null",
 "recomendadas": [{"id": "id exacto de la candidata", "encaja": ["frases muy cortas de lo que cumple"], "dudas": ["frases muy cortas de lo que no indica o no cumple"]}],
 "descartadas": [{"nombre": "nombre", "motivo": "frase corta"}]}`;

let modeloUsado: string | null = null;
let motivoFallo: string | null = null;

async function pedirIA(texto: string, d: Deteccion, candidatas: Perfil[]) {
  modeloUsado = null;
  motivoFallo = null;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  const usuario = `Lo que busca el paciente:\n"""${texto}"""\n\nCriterios detectados: ${JSON.stringify({
    tratamiento: d.tratamiento ? NOMBRE_TRATAMIENTO[d.tratamiento] : null,
    presupuesto_maximo: d.tope,
    zona: d.zona,
    tecnica: d.tecnica,
    tambien_le_importa: d.activas,
  })}\n\nClínicas candidatas:\n${JSON.stringify(candidatas.map((c) => resumenParaIA(c, d)))}`;

  // Mismo modelo que la valoración. Tarda ~15–20 s: margen hasta 26 s
  // (la ruta tiene 30 s); si no llega, explicación básica.
  for (const modelo of ["claude-sonnet-5"]) {
    try {
      const r = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: modelo,
          max_tokens: 2000,
          // Sin razonamiento extendido: gastaba el presupuesto de tokens
          // antes de escribir y la respuesta llegaba cortada o vacía.
          thinking: { type: "disabled" },
          system: SISTEMA,
          messages: [{ role: "user", content: usuario }],
        }),
        signal: AbortSignal.timeout(26000),
      });
      if (!r.ok) {
        motivoFallo = `http ${r.status}: ${(await r.text()).slice(0, 200)}`;
        console.error(`[buscador] IA ${modelo} ${motivoFallo}`);
        continue;
      }
      const data = await r.json();
      const bruto = String(
        (data.content as { type: string; text?: string }[] | undefined)
          ?.filter((b) => b.type === "text")
          .map((b) => b.text ?? "")
          .join("") ?? "",
      );
      // Aunque se pide solo JSON, a veces llega con texto o ``` alrededor:
      // se toma del primer "{" al último "}".
      const ini = bruto.indexOf("{");
      const fin = bruto.lastIndexOf("}");
      if (ini === -1 || fin <= ini) {
        motivoFallo = `sin JSON: ${bruto.slice(0, 200)}`;
        console.error(`[buscador] IA ${modelo} ${motivoFallo}`);
        continue;
      }
      modeloUsado = modelo;
      const trozo = bruto.slice(ini, fin + 1);
      try {
        JSON.parse(trozo);
      } catch (e) {
        motivoFallo = `JSON inválido (${e instanceof Error ? e.message : ""}) stop=${data.stop_reason}: ${trozo.slice(-200)}`;
        throw e;
      }
      return JSON.parse(trozo) as {
        titulo?: string;
        texto?: string;
        nota?: string | null;
        recomendadas?: { id?: string; encaja?: string[]; dudas?: string[] }[];
        descartadas?: { nombre?: string; motivo?: string }[];
      };
    } catch (e) {
      motivoFallo ??= e instanceof Error ? e.message : String(e);
      console.error(`[buscador] IA ${modelo} falló:`, motivoFallo);
    }
  }
  return null;
}

const corto = (xs: unknown, n = 4) =>
  (Array.isArray(xs) ? xs : [])
    .map((x) => String(x ?? "").trim().slice(0, 120))
    .filter(Boolean)
    .slice(0, n);

/** Explicación sin IA (si falla o no hay clave): sencilla y honesta. */
function explicacionBasica(d: Deteccion, elegidas: Perfil[]) {
  const t = d.tratamiento
    ? NOMBRE_TRATAMIENTO[d.tratamiento].replace(/\p{Lu}\p{Ll}+/gu, (w) => w.toLowerCase())
    : "lo que buscas";
  return {
    titulo: elegidas.length
      ? `Te encajan ${elegidas.length} ${elegidas.length === 1 ? "clínica" : "clínicas"}`
      : "No hemos encontrado una clínica que encaje del todo",
    texto: elegidas.length
      ? `Para ${t}${d.zona ? ` en ${d.zona.charAt(0).toUpperCase() + d.zona.slice(1)}` : ""}, estas son las que mejor cuadran con lo que nos has contado según los datos de sus fichas.`
      : "Prueba a quitar algún requisito o haz tu valoración gratuita y te ayudamos a elegir.",
    nota: null,
    recomendadas: elegidas.map((p) => ({ id: p.id, encaja: [], dudas: [] })),
    descartadas: [],
  };
}

export async function buscarClinicas(texto: string): Promise<RespuestaBuscador> {
  const d = detectar(texto);
  const perfiles = await cargarPerfiles();
  const ordenadas = perfiles
    .map((p) => ({ p, s: puntuar(p, d) }))
    .filter((x) => !d.tratamiento || haceTratamiento(x.p, d.tratamiento))
    .sort((a, b) => b.s - a.s);
  const candidatas = ordenadas.slice(0, 6).map((x) => x.p);

  const deIA = await pedirIA(texto, d, candidatas);
  const ia = deIA ?? explicacionBasica(d, candidatas.slice(0, 2));
  const porId = new Map(candidatas.map((c) => [c.id, c]));

  let recomendadas = (ia.recomendadas ?? [])
    .filter((r) => r.id && porId.has(r.id))
    .slice(0, 3)
    .map((r, i): ClinicaResultado => {
      const p = porId.get(r.id!)!;
      return {
        id: p.id,
        nombre: p.nombre,
        ciudad: p.ciudad,
        href: p.href,
        foto: p.foto,
        rating: p.rating,
        resenas: p.resenas,
        mejor: i === 0,
        encaja: corto(r.encaja),
        dudas: corto(r.dudas, 3),
        valores: valoresDe(p, d),
      };
    });
  // Si la IA no devolvió ids válidos, las dos mejores por puntuación.
  if (!recomendadas.length && candidatas.length) {
    recomendadas = candidatas.slice(0, 2).map((p, i) => ({
      id: p.id,
      nombre: p.nombre,
      ciudad: p.ciudad,
      href: p.href,
      foto: p.foto,
      rating: p.rating,
      resenas: p.resenas,
      mejor: i === 0,
      encaja: [],
      dudas: [],
      valores: valoresDe(p, d),
    }));
  }

  const pedidas = new Set([
    ...d.activas,
    ...(d.tope ? ["precio"] : []),
    ...(d.tecnica ? ["tecnica"] : []),
    ...(d.zona ? ["ubicacion"] : []),
  ]);
  const filas: FilaComparativa[] = FILAS.map((f) => ({
    id: f.id,
    etiqueta: f.etiqueta,
    pedida: f.palabras.some((w) => pedidas.has(w)),
  }));

  return {
    titulo: String(ia.titulo ?? "").slice(0, 120) || "Esto es lo que hemos encontrado",
    texto: String(ia.texto ?? "").slice(0, 900),
    nota: ia.nota ? String(ia.nota).slice(0, 240) : null,
    recomendadas,
    descartadas: (ia.descartadas ?? [])
      .map((x) => ({ nombre: String(x.nombre ?? "").slice(0, 80), motivo: String(x.motivo ?? "").slice(0, 160) }))
      .filter((x) => x.nombre && x.motivo)
      .slice(0, 3),
    filas,
    fuente: deIA ? "ia" : "basica",
    modelo: modeloUsado,
    motivo: deIA ? null : motivoFallo,
  };
}
