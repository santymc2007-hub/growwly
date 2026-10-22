import { createHmac, timingSafeEqual } from "node:crypto";
import { esc } from "@/lib/email/escapar";
import { cabeceraEmail, pieEmail } from "@/lib/email/layout";

/**
 * Email informativo a un centro que está en el directorio pero no ha
 * reclamado su ficha. NO es un email comercial: informa de la ficha
 * (RGPD art. 14, datos que no nos dio el centro) y ofrece gestionarla
 * o darse de baja. Se envía uno a uno desde /admin/clinicas.
 *
 * HTML pensado para clientes de correo (Gmail, Outlook…): tablas,
 * estilos en línea, sin flex/grid, imágenes servidas desde la web.
 */

/** Mínimo de visitas a la ficha (30 días) para mostrar el bloque de tráfico. */
export const MIN_VISITAS_PARA_TRAFICO = 10;

export type DatosEmailReclamo = {
  siteUrl: string;
  nombre: string;
  ciudad: string | null;
  tipoNegocio: string | null;
  ratingGoogle: number | null;
  resenasGoogle: number | null;
  urlFicha: string;
  urlReclamar: string;
  urlBaja: string;
  /** Solo si hay suficiente tráfico; si no, el bloque no aparece. */
  trafico: { impresiones: number; visitas: number } | null;
};

// --- Enlace de baja firmado (sin login, como exige la LSSI) ---

function clave(): string {
  const secreto = process.env.SUPABASE_SECRET_KEY;
  if (!secreto) throw new Error("Falta SUPABASE_SECRET_KEY para firmar enlaces de baja.");
  return secreto;
}

function firma(clinicId: string): string {
  return createHmac("sha256", clave()).update(`baja-reclamo:${clinicId}`).digest("hex").slice(0, 32);
}

export function enlaceBajaReclamo(siteUrl: string, clinicId: string): string {
  const params = new URLSearchParams({ c: clinicId, t: firma(clinicId) });
  return `${siteUrl}/emails/baja-centro?${params.toString()}`;
}

export function verificarBajaReclamo(clinicId: string, t: string): boolean {
  if (!/^[0-9a-f-]{36}$/i.test(clinicId) || !/^[0-9a-f]{32}$/.test(t)) return false;
  const esperada = Buffer.from(firma(clinicId));
  const recibida = Buffer.from(t);
  return esperada.length === recibida.length && timingSafeEqual(esperada, recibida);
}

// --- Plantilla ---

const C = {
  teal: "#1f5568",
  tealClaro: "#00768f",
  tinta: "#33403f",
  suave: "#66756f",
  salvia: "#eef6f1",
  salviaBorde: "#cfebdc",
  amarillo: "#e8ef2d",
  linea: "#dbe5df",
  pieTexto: "#cfe3e8",
};

const FUENTE = "'Nunito Sans', Arial, Helvetica, sans-serif";
const TITULAR = "'Nunito', 'Trebuchet MS', Arial, sans-serif";

function numero(n: number): string {
  return n.toLocaleString("es-ES");
}

export function asuntoEmailReclamo(nombre: string): string {
  return `${nombre} ya tiene su ficha en Growwly`;
}

export function construirEmailReclamo(d: DatosEmailReclamo): string {
  const img = (ruta: string) => `${d.siteUrl}${ruta}`;
  const nombre = esc(d.nombre);

  const datosFicha = [
    d.ciudad ? esc(d.ciudad) : null,
    d.tipoNegocio ? esc(d.tipoNegocio) : null,
    d.ratingGoogle !== null
      ? `${d.ratingGoogle.toLocaleString("es-ES", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} en Google${
          d.resenasGoogle ? ` (${numero(d.resenasGoogle)} reseñas)` : ""
        }`
      : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const etiquetaSeccion = (texto: string) =>
    `<span style="display:inline-block; font-family:${FUENTE}; font-size:11px; font-weight:800; letter-spacing:1px; text-transform:uppercase; color:${C.tealClaro}; border-bottom:2px solid ${C.amarillo}; padding-bottom:3px;">${texto}</span>`;

  const check = (titulo: string, resto: string) => `
    <tr>
      <td width="30" valign="top" style="padding:0 0 10px 0;">
        <div style="width:22px; height:22px; line-height:22px; border-radius:11px; background:${C.salviaBorde}; color:#1f6b43; font-weight:800; font-size:13px; text-align:center;">&#10003;</div>
      </td>
      <td valign="top" style="padding:1px 0 10px 0; font-family:${FUENTE}; font-size:15px; line-height:22px; color:${C.tinta};">
        <strong style="color:${C.teal};">${titulo}</strong>${resto}
      </td>
    </tr>`;

  const etiqueta = (texto: string) =>
    `<span style="display:inline-block; margin:0 6px 8px 0; padding:6px 14px; border:1.5px solid ${C.salviaBorde}; background:#ffffff; border-radius:999px; font-family:${FUENTE}; font-size:13px; font-weight:700; color:${C.teal};">${texto}</span>`;

  const bloqueTrafico = d.trafico
    ? `
      <tr><td style="padding:0 28px 6px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td width="50%" valign="top" style="padding-right:5px;">
              <div style="border:1px solid ${C.linea}; border-radius:10px; padding:12px 14px;">
                <div style="font-family:${TITULAR}; font-weight:800; font-size:26px; line-height:30px; color:${C.teal};">${numero(d.trafico.impresiones)}</div>
                <div style="font-family:${FUENTE}; font-size:12.5px; line-height:17px; color:${C.suave};">veces ha aparecido vuestro centro en los listados de Growwly</div>
              </div>
            </td>
            <td width="50%" valign="top" style="padding-left:5px;">
              <div style="border:1px solid ${C.linea}; border-radius:10px; padding:12px 14px;">
                <div style="font-family:${TITULAR}; font-weight:800; font-size:26px; line-height:30px; color:${C.teal};">${numero(d.trafico.visitas)}</div>
                <div style="font-family:${FUENTE}; font-size:12.5px; line-height:17px; color:${C.suave};">personas han entrado a ver vuestra ficha</div>
              </div>
            </td>
          </tr>
        </table>
        <div style="font-family:${FUENTE}; font-size:12px; color:${C.suave}; padding-top:6px;">Datos de los últimos 30 días.</div>
      </td></tr>`
    : "";

  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${asuntoEmailReclamo(nombre)}</title>
</head>
<body style="margin:0; padding:0; background:#e7efea;">
<div style="display:none; max-height:0; overflow:hidden; opacity:0;">Os contamos qué es Growwly y cómo podéis gestionar vuestra ficha.</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#e7efea;">
<tr><td align="center" style="padding:24px 12px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%; max-width:600px; background:#ffffff; border-radius:14px; overflow:hidden;">

  <!-- Cabecera -->
  ${cabeceraEmail()}
  <tr><td><img src="${img("/email/reclamo-cabecera.jpg")}" width="600" alt="Especialista explicando un tratamiento capilar a una paciente" style="display:block; width:100%; height:auto; border:0;"></td></tr>

  <!-- 1. Ficha en el directorio -->
  <tr><td style="padding:28px 28px 0;">${etiquetaSeccion("Vuestra ficha en el directorio")}</td></tr>
  <tr><td style="padding:12px 28px 0; font-family:${TITULAR}; font-weight:800; font-size:25px; line-height:31px; color:${C.teal};">Vuestro centro ya tiene su ficha en Growwly</td></tr>
  <tr><td style="padding:16px 28px 0; font-family:${FUENTE}; font-size:15px; line-height:24px; color:${C.tinta};">
    Hola, equipo de ${nombre}:<br><br>
    Os escribimos desde Growwly para contaros que vuestro centro ya aparece en nuestro directorio. Hemos creado la ficha con la información pública de vuestra web y de Google, para que las personas que buscan tratamiento capilar puedan encontraros.
  </td></tr>
  <tr><td style="padding:18px 28px 14px;">
    <div style="border:1px solid ${C.salviaBorde}; background:${C.salvia}; border-radius:12px; padding:16px 18px;">
      <div style="font-family:${FUENTE}; font-size:11px; letter-spacing:1px; text-transform:uppercase; color:${C.suave}; font-weight:700;">Vuestra ficha en Growwly</div>
      <div style="font-family:${TITULAR}; font-weight:800; font-size:19px; color:${C.teal}; padding-top:4px;">${nombre}</div>
      ${datosFicha ? `<div style="font-family:${FUENTE}; font-size:13px; color:${C.suave}; padding-top:2px;">${datosFicha}</div>` : ""}
      <a href="${d.urlFicha}" style="display:inline-block; padding-top:8px; font-family:${FUENTE}; font-size:13px; color:${C.tealClaro}; font-weight:700; text-decoration:none;">Ver la ficha tal como la ven los pacientes &rarr;</a>
    </div>
  </td></tr>
  ${bloqueTrafico}
  <tr><td align="center" style="padding:18px 28px 0;">
    <a href="${d.urlReclamar}" style="display:inline-block; background:${C.amarillo}; color:${C.teal}; font-family:${TITULAR}; font-weight:800; font-size:16px; padding:14px 30px; border-radius:999px; text-decoration:none;">Reclamar nuestra ficha</a>
    <div style="font-family:${FUENTE}; font-size:12px; color:${C.suave}; padding-top:8px;">Es gratis y lleva un par de minutos.</div>
  </td></tr>
  <tr><td style="padding:26px 28px 6px; font-family:${TITULAR}; font-weight:800; font-size:18px; color:${C.teal};">Qué podéis hacer con vuestra ficha una vez reclamada</td></tr>
  <tr><td style="padding:8px 28px 28px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      ${check("Corregirla y completarla", ": horarios, tratamientos, fotos, equipo e idiomas.")}
      ${check("Recibir los contactos", " de las personas que os escriben desde vuestra ficha.")}
      ${check("Ver vuestras estadísticas", ": cuántas personas ven la ficha y cuántas os llaman, os escriben o piden cita.")}
    </table>
  </td></tr>

  <!-- 2. Plataforma de marketing -->
  <tr><td style="background:${C.salvia}; padding:28px 28px 30px;">
    ${etiquetaSeccion("Plataforma de marketing")}
    <div style="font-family:${TITULAR}; font-weight:800; font-size:23px; line-height:29px; color:${C.teal}; padding-top:12px;">Qué es Growwly</div>
    <div style="font-family:${FUENTE}; font-size:15px; line-height:24px; color:${C.tinta}; padding-top:12px;">
      Growwly es una plataforma especializada en salud capilar: un espacio donde cada centro tiene su sitio, y donde las personas que se preocupan por su cabello encuentran rápido a quién acudir en su ciudad.<br><br>
      Pero no somos solo un directorio ni un comparador. <strong>Growwly es una plataforma de marketing que os ayuda a atraer pacientes</strong>: nosotros nos encargamos de atraer a las personas interesadas, y vosotros, de que vuestra ficha las convenza.
    </div>
    <div style="padding-top:16px;">
      ${etiqueta("Posicionamiento en Google (SEO)")}${etiqueta("Redes sociales")}${etiqueta("Campañas en Google y Meta")}${etiqueta("Valoración capilar con IA")}
    </div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:10px; background:${C.teal}; border-radius:14px; overflow:hidden;">
      <tr><td><img src="${img("/email/reclamo-valoracion-ia.jpg")}" width="544" alt="Persona haciéndose una foto del cuero cabelludo con el móvil" style="display:block; width:100%; height:auto; border:0;"></td></tr>
      <tr><td style="padding:20px 22px 22px; font-family:${FUENTE}; color:#e3f1f4;">
        <div style="font-family:${TITULAR}; font-weight:800; font-size:21px; line-height:27px; color:#ffffff;">Pacientes que llegan <span style="background:rgba(232,239,45,0.45);">con los deberes hechos</span></div>
        <div style="font-size:14px; line-height:22px; padding:8px 0 12px;">Nuestra valoración capilar con IA convierte cada visita en un contacto de alto valor. Antes de llegar a vosotros, el paciente ya ha subido sus fotos y nos ha contado su caso.</div>
        <div style="font-size:13.5px; line-height:24px;">
          <span style="color:${C.amarillo}; font-weight:800;">&#10003;</span>&nbsp; Fotos de la zona que le preocupa<br>
          <span style="color:${C.amarillo}; font-weight:800;">&#10003;</span>&nbsp; Una valoración capilar orientativa<br>
          <span style="color:${C.amarillo}; font-weight:800;">&#10003;</span>&nbsp; La información médica necesaria para decidir
        </div>
        <div style="font-size:14px; font-weight:700; color:#ffffff; padding-top:12px;">Vosotros solo tenéis que responder con un presupuesto aproximado.</div>
      </td></tr>
    </table>
  </td></tr>

  <!-- Cierre -->
  <tr><td style="padding:26px 28px 28px; font-family:${FUENTE}; font-size:14px; line-height:22px; color:${C.tinta};">
    Si tenéis cualquier duda, o hay algún dato de vuestra ficha que no es correcto, nos podéis escribir a <a href="mailto:hola@growwly.es" style="color:${C.tealClaro};">hola@growwly.es</a>.<br><br>
    Un saludo,<br><strong>El equipo de Growwly</strong>
  </td></tr>

  <!-- Pie -->
  ${pieEmail(
    "clinica",
    `<strong style="color:#ffffff;">¿Por qué recibís este email?</strong> Vuestros datos de contacto son públicos y los usamos solo para informaros de vuestra ficha en Growwly.<br><br>¿Preferís no aparecer en Growwly o no recibir más emails? <a href="${d.urlBaja}" style="color:#ffffff;">Pulsad aquí</a> o responded con «BAJA» y lo hacemos.`,
  )}

</table>
</td></tr>
</table>
</body>
</html>`;
}
