// Descarga de todas las clínicas de Growwly en un archivo que abre Excel
// directamente (CSV con ";" y BOM UTF-8, el formato que Excel en español
// lee sin asistente de importación). Growwly es la fuente de verdad: este
// archivo es una copia de consulta, nunca se vuelve a importar.

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { slugifyCiudad, slugifyProvincia } from "@/lib/clinic-options";
import type { Clinic } from "@/lib/supabase/database.types";

export const dynamic = "force-dynamic";

type DiaHorario = { dia?: string; abierto?: boolean; desde?: string; hasta?: string };

function celda(valor: unknown): string {
  if (valor === null || valor === undefined) return "";
  const texto =
    typeof valor === "number"
      ? String(valor).replace(".", ",") // decimales a la española
      : typeof valor === "boolean"
        ? valor
          ? "Sí"
          : "No"
        : String(valor);
  // Comillas si hace falta y sin saltos de línea dentro de la celda.
  const limpio = texto.replace(/\r?\n/g, " ").trim();
  return /[";]/.test(limpio) ? `"${limpio.replace(/"/g, '""')}"` : limpio;
}

function horarioTexto(c: Clinic): string {
  if (c.horarios) return c.horarios;
  const dias = Array.isArray(c.horarios_estructurados) ? (c.horarios_estructurados as DiaHorario[]) : [];
  return dias
    .map((d) => `${(d.dia ?? "").slice(0, 3)} ${d.abierto ? `${d.desde}-${d.hasta}` : "cerrado"}`)
    .join("; ");
}

function red(c: Clinic, nombre: string): string {
  const redes = c.redes_sociales;
  return redes && typeof redes === "object" && !Array.isArray(redes)
    ? String((redes as Record<string, unknown>)[nombre] ?? "")
    : "";
}

const COLUMNAS: [string, (c: Clinic, base: string) => unknown][] = [
  ["Nombre de la Clínica", (c) => c.nombre],
  ["Publicada", (c) => c.publicado],
  ["Verificada", (c) => c.verificado],
  ["Tipo de negocio", (c) => c.tipo_negocio],
  ["Descripción", (c) => c.descripcion],
  ["Dirección", (c) => c.direccion],
  ["Municipio", (c) => c.ciudad],
  ["Barrio/Zona", (c) => c.zona],
  ["Provincia", (c) => c.provincia],
  ["Teléfono", (c) => c.telefono],
  ["Email", (c) => c.email],
  ["Web", (c) => c.web],
  ["Latitud", (c) => c.lat],
  ["Longitud", (c) => c.lng],
  ["Técnicas/tratamientos capilares", (c) => (c.tecnicas ?? []).join(", ")],
  ["Otros servicios", (c) => (c.servicios_adicionales ?? []).join(", ")],
  ["Precio desde (€)", (c) => c.precio_desde],
  ["Precio hasta (€)", (c) => c.precio_hasta],
  ["Notas de precio", (c) => c.rango_precios],
  ["Tiene oferta", (c) => c.tiene_oferta],
  ["Detalle oferta", (c) => c.detalle_oferta],
  ["Financiación", (c) => c.financiacion],
  ["Primera consulta gratis", (c) => c.primera_consulta_gratis],
  ["Idiomas", (c) => (c.idiomas ?? []).join(", ")],
  ["Accesibilidad", (c) => [c.accesibilidad, ...(c.accesibilidad_checks ?? [])].filter(Boolean).join(", ")],
  ["Rating Google", (c) => c.rating_google],
  ["Nº Reseñas Google", (c) => c.resenas_google],
  ["Rating Doctoralia", (c) => c.rating_doctoralia],
  ["Nº Reseñas Doctoralia", (c) => c.resenas_doctoralia],
  ["Horarios", horarioTexto],
  ["Instagram", (c) => red(c, "instagram")],
  ["Facebook", (c) => red(c, "facebook")],
  ["TikTok", (c) => red(c, "tiktok")],
  ["LinkedIn", (c) => red(c, "linkedin")],
  ["Ficha de Google Maps", (c) => c.google_maps_url],
  ["Logo", (c) => c.logo_url],
  ["Nº fotos", (c) => (c.fotos ?? []).length],
  ["Fotos", (c) => (c.fotos ?? []).join(" | ")],
  ["Plan", (c) => (c.plan === "premium" ? "Perfil detallado" : "Básico")],
  [
    "Ficha en Growwly",
    (c, base) =>
      c.publicado
        ? `${base}/clinicas/${slugifyProvincia(c.provincia)}/${c.ciudad ? slugifyCiudad(c.ciudad) : "sin-ciudad"}/${c.slug}`
        : "",
  ],
  ["Última actualización", (c) => (c.updated_at ? c.updated_at.slice(0, 10) : "")],
];

export async function GET() {
  // /admin ya está protegido en proxy.ts; se comprueba también aquí
  // porque el archivo lleva todos los datos de contacto.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response("No autorizado", { status: 401 });

  const admin = createAdminClient();
  const { data: profile } = await admin.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "admin") return new Response("No autorizado", { status: 403 });

  const { data, error } = await admin
    .from("clinics")
    .select("*")
    .order("provincia")
    .order("ciudad")
    .order("nombre");
  if (error) return new Response(`Error al leer las clínicas: ${error.message}`, { status: 500 });

  const base = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.growwly.es").replace(/\/$/, "");
  const filas = [
    COLUMNAS.map(([titulo]) => celda(titulo)).join(";"),
    ...(data ?? []).map((c) => COLUMNAS.map(([, valor]) => celda(valor(c, base))).join(";")),
  ];

  const fecha = new Date().toISOString().slice(0, 10);
  return new Response(`﻿${filas.join("\r\n")}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="growwly-clinicas-${fecha}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
