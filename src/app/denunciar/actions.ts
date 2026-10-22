"use server";

import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { enviarEmail } from "@/lib/email/resend";
import { esc } from "@/lib/email/escapar";
import { huellaIp } from "@/lib/seguridad/huella-ip";
import { MOTIVOS_DENUNCIA, esMotivo } from "./motivos";
import { envolverEmail, ESTILO } from "@/lib/email/layout";

// Un solo email de contacto por ahora (decisión de Santy, 21 oct 2026).
const EMAIL_DENUNCIAS = "hola@growwly.es";
const MAX_POR_IP_HORA = 5;
const MAX_GLOBAL_HORA = 100;

function volver(url: string, error: string): never {
  redirect(`/denunciar?url=${encodeURIComponent(url)}&error=${encodeURIComponent(error)}`);
}

/**
 * Denuncia de contenido (Reglamento de Servicios Digitales, art. 16):
 * se guarda, se avisa a Growwly y se confirma la recepción a quien
 * denuncia (art. 16.4).
 */
export async function enviarDenuncia(formData: FormData) {
  const url = String(formData.get("url") ?? "").trim().slice(0, 500);
  const motivo = String(formData.get("motivo") ?? "");
  const explicacion = String(formData.get("explicacion") ?? "").trim();
  const nombre = String(formData.get("nombre") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const buenaFe = formData.get("buena_fe") === "on";

  // Campo trampa: invisible para personas, los bots lo rellenan.
  if (String(formData.get("web") ?? "") !== "") redirect("/denunciar?enviada=1");

  if (!url) volver(url, "Indica la página o el contenido que denuncias.");
  if (!esMotivo(motivo)) volver(url, "Elige el motivo de la denuncia.");
  if (explicacion.length < 10 || explicacion.length > 4000) {
    volver(url, "Explica en unas líneas por qué crees que el contenido es falso o ilegal.");
  }
  if (!nombre || nombre.length > 200) volver(url, "Escribe tu nombre.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 320) {
    volver(url, "Escribe un email válido para poder responderte.");
  }
  if (!buenaFe) volver(url, "Marca la casilla que confirma que la denuncia es de buena fe.");

  const admin = createAdminClient();
  const ipHash = await huellaIp();
  const haceUnaHora = new Date(Date.now() - 60 * 60 * 1000).toISOString();

  const [{ count: porIp }, { count: global }] = await Promise.all([
    ipHash
      ? admin
          .from("denuncias_contenido")
          .select("id", { count: "exact", head: true })
          .eq("ip_hash", ipHash)
          .gte("creado_en", haceUnaHora)
      : Promise.resolve({ count: 0 }),
    admin
      .from("denuncias_contenido")
      .select("id", { count: "exact", head: true })
      .gte("creado_en", haceUnaHora),
  ]);
  if ((porIp ?? 0) >= MAX_POR_IP_HORA || (global ?? 0) >= MAX_GLOBAL_HORA) {
    volver(url, `Has enviado varias denuncias seguidas. Inténtalo dentro de una hora o escríbenos a ${EMAIL_DENUNCIAS}.`);
  }

  const { data: denuncia, error } = await admin
    .from("denuncias_contenido")
    .insert({ url, motivo, explicacion, nombre, email, buena_fe: true, ip_hash: ipHash })
    .select("id")
    .single();

  if (error || !denuncia) {
    volver(url, `No se ha podido enviar. Inténtalo de nuevo o escríbenos a ${EMAIL_DENUNCIAS}.`);
  }

  const referencia = denuncia.id.slice(0, 8).toUpperCase();
  const motivoTexto = MOTIVOS_DENUNCIA[motivo];

  // Si falla un email, la denuncia ya está guardada: no se le muestra
  // error a quien denuncia.
  await Promise.allSettled([
    enviarEmail({
      to: EMAIL_DENUNCIAS,
      subject: `Denuncia de contenido ${referencia}: ${motivoTexto}`,
      html: envolverEmail({
        audiencia: "interno",
        cuerpo: `
          <h1 style="${ESTILO.h1}">Nueva denuncia de contenido (${referencia})</h1>
          <p><strong>Contenido:</strong> ${esc(url)}</p>
          <p><strong>Motivo:</strong> ${esc(motivoTexto)}</p>
          <p><strong>Explicación:</strong><br>${esc(explicacion).replace(/\n/g, "<br>")}</p>
          <p><strong>Denuncia:</strong> ${esc(nombre)} &lt;${esc(email)}&gt;</p>
          <p style="${ESTILO.nota}">Hay que revisarla y responder a quien denuncia con la decisión y el motivo. Queda guardada en la tabla denuncias_contenido de Supabase.</p>
        `,
      }),
    }),
    enviarEmail({
      to: email,
      subject: `Hemos recibido tu denuncia (${referencia})`,
      html: envolverEmail({
        audiencia: "paciente",
        cuerpo: `
          <h1 style="${ESTILO.h1}">Hemos recibido tu denuncia</h1>
          <p>Hola ${esc(nombre)},</p>
          <p>Gracias por avisarnos. Vamos a revisar el contenido que nos indicas y te escribiremos con lo que decidamos y por qué.</p>
          <p><strong>Contenido:</strong> ${esc(url)}<br><strong>Motivo:</strong> ${esc(motivoTexto)}<br><strong>Referencia:</strong> ${referencia}</p>
          <p style="${ESTILO.nota}">Si necesitas añadir algo, responde a ${esc(EMAIL_DENUNCIAS)} indicando la referencia.</p>
        `,
      }),
    }),
  ]);

  redirect(`/denunciar?enviada=1&ref=${referencia}`);
}
