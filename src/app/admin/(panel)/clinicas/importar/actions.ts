"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { uploadClinicPhotos } from "@/lib/supabase/storage";
import { slugify } from "@/lib/slugify";
import { TECNICAS_DISPONIBLES, IDIOMAS_DISPONIBLES, DESCRIPCION_MIN_CARACTERES, tipoNegocioValido } from "@/lib/clinic-options";
import { extraerDatosWeb, normalizarUrlWeb } from "@/lib/importador/firecrawl";
import { buscarEnGoogle, fichaDesdeEnlaceMaps } from "@/lib/importador/places";
import { descargarImagen } from "@/lib/importador/descargar";
import { sinAcentos } from "@/lib/importador/normalizar";
import type {
  CandidatoGoogle,
  ClinicaExistente,
  DatosWeb,
  ResultadoAnalisis,
} from "@/lib/importador/tipos";
import type { Database } from "@/lib/supabase/database.types";
import { descripcionTextoPlano } from "@/lib/clinica/descripcion-texto";

type ClinicUpdate = Database["public"]["Tables"]["clinics"]["Update"];

const MAX_FOTOS = 10;

/**
 * Estas acciones llaman a APIs de pago (Firecrawl, Google) y escriben
 * en la BD con permisos de servicio: además de la protección de /admin
 * en proxy.ts, se comprueba aquí mismo que quien llama es admin.
 */
async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Sesión caducada. Vuelve a entrar en el panel.");
  const { data: profile } = await createAdminClient()
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (profile?.role !== "admin") throw new Error("No autorizado.");
}

function str(formData: FormData, key: string): string | null {
  const v = formData.get(key);
  return v && String(v).trim() !== "" ? String(v).trim() : null;
}

function dominio(url: string | null | undefined): string | null {
  if (!url) return null;
  const normalizada = normalizarUrlWeb(url);
  if (!normalizada) return null;
  return new URL(normalizada).hostname.replace(/^www\./, "").toLowerCase();
}

async function buscarExistentes(
  web: DatosWeb | null,
  webEntrada: string | null,
  google: CandidatoGoogle[],
  nombre: string,
): Promise<ClinicaExistente[]> {
  const supabase = createAdminClient();
  const { data } = await supabase.from("clinics").select("id, nombre, web, google_place_id");
  const clinicas = data ?? [];

  const dominios = new Set(
    [dominio(webEntrada), dominio(web?.urlFinal)].filter((d): d is string => Boolean(d)),
  );
  const placeIds = new Set(google.map((g) => g.placeId));
  const nombreLimpio = sinAcentos(nombre);

  const encontradas: ClinicaExistente[] = [];
  for (const c of clinicas) {
    let motivo: string | null = null;
    if (c.google_place_id && placeIds.has(c.google_place_id)) motivo = "misma ficha de Google";
    else if (c.web && Array.from(dominios).some((d) => (c.web ?? "").toLowerCase().includes(d)))
      motivo = "misma web";
    else if (nombreLimpio && sinAcentos(c.nombre) === nombreLimpio) motivo = "mismo nombre";
    if (motivo) encontradas.push({ id: c.id, nombre: c.nombre, motivo });
  }
  return encontradas;
}

export async function analizarClinica(
  _prev: ResultadoAnalisis | null,
  formData: FormData,
): Promise<ResultadoAnalisis> {
  try {
    await requireAdmin();

    const webEntrada = str(formData, "web");
    const nombre = str(formData, "nombre") ?? "";
    const municipio = str(formData, "municipio");
    const clinicaId = str(formData, "clinica_id");
    const enlaceMaps = str(formData, "maps_url");

    if (!webEntrada && !nombre && !enlaceMaps) {
      return { ok: false, error: "Pon al menos la web, el nombre o el enlace de Google Maps." };
    }
    if (webEntrada && !normalizarUrlWeb(webEntrada)) {
      return { ok: false, error: "La web no tiene un formato válido (ej. clinicaejemplo.com)." };
    }

    const supabase = createAdminClient();
    const { data: municipiosData } = await supabase.from("municipios").select("nombre");
    const municipios = (municipiosData ?? []).map((m) => m.nombre);

    const consultaGoogle = (nombreBase: string) =>
      [nombreBase, municipio].filter(Boolean).join(" ");

    let web: DatosWeb | null = null;
    let errorWeb: string | null = null;
    let google: CandidatoGoogle[] = [];
    let errorGoogle: string | null = null;

    const leerWeb = async () => {
      if (!webEntrada) return;
      try {
        web = await extraerDatosWeb(webEntrada);
      } catch (e) {
        errorWeb = e instanceof Error ? e.message : "No se pudo leer la web.";
      }
    };
    const buscarGoogle = async (nombreBase: string) => {
      // Con enlace pegado se usa esa ficha exacta, sin búsqueda. Si el
      // enlace no se puede resolver se avisa y se busca por nombre.
      if (enlaceMaps) {
        try {
          google = [await fichaDesdeEnlaceMaps(enlaceMaps, municipios)];
          return;
        } catch (e) {
          errorGoogle = `Enlace de Maps: ${e instanceof Error ? e.message : "no válido."}${
            nombreBase ? " Se ha buscado por nombre." : ""
          }`;
        }
      }
      if (!nombreBase) return;
      try {
        google = await buscarEnGoogle(consultaGoogle(nombreBase), municipios);
      } catch (e) {
        errorGoogle = e instanceof Error ? e.message : "No se pudo consultar Google.";
      }
    };

    if (nombre || enlaceMaps) {
      // Con nombre o enlace se puede ir a Google a la vez que se lee la web.
      await Promise.all([leerWeb(), buscarGoogle(nombre)]);
    } else {
      // Solo con web: el nombre para Google sale de la propia web.
      await leerWeb();
      await buscarGoogle((web as DatosWeb | null)?.titulo ?? "");
    }

    const webFinal = web as DatosWeb | null;
    const googleFinal = google as CandidatoGoogle[];
    const nombreBuscado = nombre || googleFinal[0]?.nombre || webFinal?.titulo || "";

    return {
      ok: true,
      propuesta: {
        web: webFinal,
        errorWeb,
        google,
        errorGoogle,
        existentes: clinicaId ? [] : await buscarExistentes(webFinal, webEntrada, google, nombreBuscado),
        nombreBuscado,
      },
    };
  } catch (e) {
    console.error(e);
    return { ok: false, error: e instanceof Error ? e.message : "Error inesperado al analizar." };
  }
}

/** Lee el candidato de Google elegido (viaja como JSON en un campo oculto). */
function leerGoogle(formData: FormData): CandidatoGoogle | null {
  const raw = str(formData, "google");
  if (!raw) return null;
  try {
    const g = JSON.parse(raw) as Partial<CandidatoGoogle>;
    if (typeof g.placeId !== "string" || !g.placeId) return null;
    const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : null);
    return {
      placeId: g.placeId,
      nombre: String(g.nombre ?? ""),
      direccion: String(g.direccion ?? ""),
      telefono: typeof g.telefono === "string" ? g.telefono : null,
      web: typeof g.web === "string" ? g.web : null,
      lat: num(g.lat),
      lng: num(g.lng),
      rating: num(g.rating),
      totalResenas: num(g.totalResenas),
      mapsUri: typeof g.mapsUri === "string" ? g.mapsUri : null,
      ciudad: typeof g.ciudad === "string" ? g.ciudad : null,
      provincia: typeof g.provincia === "string" ? g.provincia : null,
      horariosEstructurados: Array.isArray(g.horariosEstructurados) ? g.horariosEstructurados : [],
      horariosTexto: typeof g.horariosTexto === "string" ? g.horariosTexto : null,
      accesibilidadChecks: Array.isArray(g.accesibilidadChecks)
        ? g.accesibilidadChecks.filter((x): x is string => typeof x === "string")
        : [],
    };
  } catch {
    return null;
  }
}

/** Descarga y sube a Storage; si una foto falla se salta (no tumba el guardado). */
async function subirDesdeUrls(urls: string[], prefijo: string): Promise<{ subidas: string[]; fallos: number }> {
  const supabase = createAdminClient();
  const resultados = await Promise.allSettled(
    urls.map((u, i) => descargarImagen(u, `${prefijo}-${i + 1}`)),
  );
  const archivos = resultados
    .filter((r): r is PromiseFulfilledResult<File> => r.status === "fulfilled")
    .map((r) => r.value);
  const subidas = archivos.length ? await uploadClinicPhotos(supabase, archivos) : [];
  return { subidas, fallos: urls.length - archivos.length };
}

function vacio(v: unknown): boolean {
  if (v === null || v === undefined) return true;
  if (typeof v === "string") return v.trim() === "";
  if (Array.isArray(v)) return v.length === 0;
  if (typeof v === "object") return Object.keys(v as object).length === 0;
  return false;
}

export async function guardarImportacion(
  _prev: { error: string } | null,
  formData: FormData,
): Promise<{ error: string } | null> {
  let destino: string;
  try {
    await requireAdmin();
    const supabase = createAdminClient();

    const clinicaId = str(formData, "clinica_id");
    const nombre = str(formData, "nombre");
    if (!clinicaId && !nombre) return { error: "El nombre es obligatorio." };

    const google = leerGoogle(formData);

    const redes: Record<string, string> = {};
    for (const red of ["instagram", "facebook", "tiktok", "linkedin"]) {
      const v = str(formData, `red_${red}`);
      if (v) redes[red] = v;
    }

    const tecnicas = formData
      .getAll("tecnicas")
      .map(String)
      .filter((t) => (TECNICAS_DISPONIBLES as readonly string[]).includes(t));
    const idiomas = formData
      .getAll("idiomas")
      .map(String)
      .filter((i) => (IDIOMAS_DISPONIBLES as readonly string[]).includes(i));
    const detalleOferta = str(formData, "detalle_oferta");

    // Todo lo que se propone para la ficha; en modo "completar" solo se
    // aplicará lo que esa ficha tenga vacío.
    const propuesta: ClinicUpdate = {
      tipo_negocio: tipoNegocioValido(str(formData, "tipo_negocio")),
      descripcion: str(formData, "descripcion"),
      direccion: str(formData, "direccion"),
      ciudad: str(formData, "ciudad"),
      provincia: str(formData, "provincia") ?? google?.provincia ?? "Illes Balears",
      telefono: str(formData, "telefono"),
      email: str(formData, "email"),
      web: str(formData, "web"),
      tecnicas,
      idiomas,
      redes_sociales: redes,
      rango_precios: str(formData, "rango_precios"),
      detalle_oferta: detalleOferta,
      tiene_oferta: Boolean(detalleOferta),
      financiacion: formData.get("financiacion") === "on",
      primera_consulta_gratis: formData.get("primera_consulta_gratis") === "on",
      ...(google
        ? {
            lat: google.lat,
            lng: google.lng,
            google_place_id: google.placeId,
            google_maps_url: google.mapsUri,
            rating_google: google.rating,
            resenas_google: google.totalResenas,
            google_synced_at: new Date().toISOString(),
            horarios_estructurados: google.horariosEstructurados,
            horarios: google.horariosTexto,
            accesibilidad_checks: google.accesibilidadChecks,
          }
        : {}),
    };
    if (propuesta.provincia === "Illes Balears") propuesta.comunidad_autonoma = "Illes Balears";

    const fotosUrls = formData.getAll("fotos").map(String).slice(0, MAX_FOTOS);
    const logoUrlOrigen = str(formData, "logo");

    if (clinicaId) {
      // ---------- Completar ficha existente ----------
      const { data: actual, error: errLectura } = await supabase
        .from("clinics")
        .select("*")
        .eq("id", clinicaId)
        .single();
      if (errLectura || !actual) return { error: "No se encontró la ficha a completar." };

      const cambios: ClinicUpdate = {};
      for (const [clave, valor] of Object.entries(propuesta) as [keyof ClinicUpdate, unknown][]) {
        if (vacio(valor)) continue;
        const valorActual = (actual as Record<string, unknown>)[clave];
        // Booleanos: solo se activan (nunca se desactiva algo que ya estaba marcado).
        if (typeof valor === "boolean") {
          if (valor && !valorActual) (cambios as Record<string, unknown>)[clave] = true;
          continue;
        }
        // La "descripcion" es un caso especial: un resumen corto (de antes
        // de generarla con IA a partir de la web, o escrito a mano de
        // paso) no cuenta como "ya completa" — se sigue pudiendo sustituir
        // por el texto largo nuevo. El resto de campos, si ya tienen algo,
        // nunca se tocan.
        const yaCompleto =
          clave === "descripcion" && typeof valorActual === "string"
            ? descripcionTextoPlano(valorActual).length >= DESCRIPCION_MIN_CARACTERES
            : !vacio(valorActual);
        if (!yaCompleto) (cambios as Record<string, unknown>)[clave] = valor;
      }
      // La ficha de Google va en bloque: si ya tenía una vinculada, no se
      // mezclan datos de otra (rating de una y coordenadas de otra).
      if (actual.google_place_id) {
        for (const k of [
          "google_place_id",
          "google_maps_url",
          "rating_google",
          "resenas_google",
          "google_synced_at",
          "lat",
          "lng",
        ] as const) {
          delete cambios[k];
        }
      }
      // La provincia siempre tiene valor por defecto; no se toca al completar.
      delete cambios.provincia;
      delete cambios.comunidad_autonoma;
      // Técnicas e idiomas son casillas del catálogo que el admin ya ha
      // revisado (precargadas con lo que tenía la ficha + lo de la web):
      // se guarda lo marcado tal cual, igual que hace el formulario de
      // edición. Así se limpian los textos libres antiguos que no casan
      // con el catálogo ("FUSS y DHI", "inglés"...).
      if (tecnicas.length) cambios.tecnicas = tecnicas;
      if (idiomas.length) cambios.idiomas = idiomas;

      const prefijo = slugify(actual.nombre) || "clinica";
      const { subidas, fallos } = await subirDesdeUrls(fotosUrls, prefijo);
      if (subidas.length) cambios.fotos = [...(actual.fotos ?? []), ...subidas];

      if (logoUrlOrigen && (!actual.logo_url || formData.get("reemplazar_logo") === "on")) {
        const { subidas: [logo] = [] } = await subirDesdeUrls([logoUrlOrigen], `${prefijo}-logo`);
        if (logo) cambios.logo_url = logo;
      }

      if (Object.keys(cambios).length > 0) {
        const { error } = await supabase.from("clinics").update(cambios).eq("id", clinicaId);
        if (error) {
          return {
            error: error.message.includes("clinics_google_place_id_idx")
              ? "Esa ficha de Google ya está vinculada a otra clínica de Growwly."
              : error.message,
          };
        }
      }

      const aviso = fallos ? `${fallos} foto(s) no se pudieron descargar.` : "";
      destino = `/admin/clinicas/${clinicaId}/editar${aviso ? `?error=${encodeURIComponent(aviso)}` : ""}`;
    } else {
      // ---------- Ficha nueva ----------
      let slug = slugify(nombre!);
      const { data: colision } = await supabase.from("clinics").select("id").eq("slug", slug).maybeSingle();
      if (colision) slug = `${slug}-${crypto.randomUUID().slice(0, 6)}`;

      const { subidas: fotos, fallos } = await subirDesdeUrls(fotosUrls, slug);
      let logoUrl: string | null = null;
      if (logoUrlOrigen) {
        const { subidas: [logo] = [] } = await subirDesdeUrls([logoUrlOrigen], `${slug}-logo`);
        logoUrl = logo ?? null;
      }

      const { data: creada, error } = await supabase
        .from("clinics")
        .insert({
          ...propuesta,
          nombre: nombre!,
          slug,
          fotos,
          logo_url: logoUrl,
          // Siempre entra oculta: se revisa y publica desde el admin.
          publicado: false,
          verificado: false,
          verificado_admin: false,
          leads_enabled: false,
        })
        .select("id")
        .single();

      if (error || !creada) {
        return {
          error: error?.message.includes("clinics_google_place_id_idx")
            ? "Esa ficha de Google ya está vinculada a otra clínica de Growwly."
            : (error?.message ?? "No se pudo crear la ficha."),
        };
      }

      // Viene de "Importar provincia": se marca el candidato como importado.
      const candidatoId = str(formData, "candidato_id");
      if (candidatoId) {
        await supabase
          .from("importacion_candidatos")
          .update({ estado: "importado", clinic_id: creada.id, motivo: null })
          .eq("id", candidatoId);
      }

      const aviso = fallos ? `${fallos} foto(s) no se pudieron descargar.` : "";
      destino = `/admin/clinicas/${creada.id}/editar${aviso ? `?error=${encodeURIComponent(aviso)}` : ""}`;
    }
  } catch (e) {
    console.error(e);
    return { error: e instanceof Error ? e.message : "Error inesperado al guardar." };
  }

  revalidatePath("/admin/clinicas");
  revalidatePath("/centros");
  redirect(destino);
}
