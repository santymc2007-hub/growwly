/**
 * Cabecera y cierre comunes de todos los emails de Growwly.
 *
 * Cada plantilla escribe solo su contenido (titular, texto, botón) y lo
 * pasa por envolverEmail(): así todos salen con el mismo marco, la misma
 * tipografía y el mismo pie, y un cambio de marca se hace en un sitio.
 *
 * Maquetado con tablas y estilos en línea, que es lo único que respetan
 * Gmail, Outlook y Apple Mail por igual.
 */

const SITE = () => process.env.NEXT_PUBLIC_SITE_URL || "https://www.growwly.es";

/** Paleta del moodboard de marca (oct 2026). */
export const COLOR = {
  bosque: "#0F4B3C",
  bosqueClaro: "#1E6B57",
  tinta: "#1D1D1D",
  suave: "#5E6B66",
  menta: "#DDF2EE",
  mentaBorde: "#BFE3DA",
  lima: "#D8EE8D",
  linea: "#E6EAE8",
  fondo: "#F4F4F4",
  blanco: "#FDFDFD",
  pieTexto: "#CFE3DC",
};

export const FUENTE = "'Open Sans', Arial, Helvetica, sans-serif";
export const TITULAR = "'Poppins', 'Trebuchet MS', Arial, sans-serif";

/** Estilos para usar dentro del contenido de cada plantilla. */
export const ESTILO = {
  h1: `margin:0 0 16px; font-family:${TITULAR}; font-weight:700; font-size:24px; line-height:32px; color:${COLOR.bosque};`,
  nota: `font-size:13px; line-height:20px; color:${COLOR.suave};`,
  caja: `background:${COLOR.menta}; border:1px solid ${COLOR.mentaBorde}; border-radius:16px; padding:14px 16px;`,
  chip: `display:inline-block; background:${COLOR.lima}; color:${COLOR.bosque}; font-family:${TITULAR}; font-weight:600; font-size:12px; padding:4px 12px; border-radius:999px;`,
};

/** Palabra clave resaltada con el subrayado lima de la marca, para titulares. */
export function marcador(texto: string): string {
  return `<span style="background-color:${COLOR.lima}; padding:0 4px; border-radius:4px;">${texto}</span>`;
}

/** Botón principal: verde bosque, radio 12 px, como en la web. */
export function boton(href: string, texto: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0 8px;"><tr><td style="border-radius:12px; background:${COLOR.bosque};">
    <a href="${href}" style="display:inline-block; padding:13px 24px; font-family:${TITULAR}; font-weight:600; font-size:15px; color:#ffffff; text-decoration:none; border-radius:12px;">${texto}</a>
  </td></tr></table>`;
}

/** Fila etiqueta → valor para tablas de datos (solicitud, cita…). */
export function filaDato(etiqueta: string, valor: string): string {
  return `<tr><td style="padding:7px 0; border-bottom:1px solid ${COLOR.linea}; color:${COLOR.suave}; font-size:14px;">${etiqueta}</td><td style="padding:7px 0; border-bottom:1px solid ${COLOR.linea}; text-align:right; font-weight:700; font-size:14px; color:${COLOR.tinta};">${valor}</td></tr>`;
}

export function tablaDatos(filas: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;">${filas}</table>`;
}

export type Audiencia = "paciente" | "clinica" | "interno";

const MOTIVO: Record<Audiencia, string> = {
  paciente: "Te escribimos por tu actividad en Growwly.",
  clinica: "Os escribimos porque vuestro centro está en el directorio de Growwly.",
  interno: "Aviso interno de Growwly. No lo reenvíes fuera del equipo.",
};

/** Fila de cabecera: logo sobre blanco. */
export function cabeceraEmail(): string {
  return `<tr><td style="padding:20px 28px; border-bottom:4px solid ${COLOR.lima};">
    <a href="${SITE()}" style="text-decoration:none;"><img src="${SITE()}/brand/growwly-logo-verde.png" width="99" height="34" alt="Growwly" style="display:block; border:0;"></a>
  </td></tr>`;
}

/** Fila de pie: banda oscura con logo, motivo del envío y enlaces. */
export function pieEmail(audiencia: Audiencia, extra = ""): string {
  const s = SITE();
  const enlace = (href: string, t: string) => `<a href="${href}" style="color:#ffffff; text-decoration:underline;">${t}</a>`;
  return `<tr><td style="background:${COLOR.bosque}; padding:24px 28px 26px; font-family:${FUENTE}; font-size:12px; line-height:18px; color:${COLOR.pieTexto};">
    <img src="${s}/brand/growwly-logo-white.png" width="82" height="28" alt="Growwly" style="display:block; border:0; margin-bottom:12px;">
    ${MOTIVO[audiencia]}${extra ? `<br><br>${extra}` : ""}<br><br>
    ${enlace(s, "growwly.es")} · hola@growwly.es · ${enlace(`${s}/legal/privacidad`, "Privacidad")}
  </td></tr>`;
}

/**
 * Documento completo: fondo, tarjeta de 600 px, cabecera, contenido y pie.
 * `preheader` es el texto que algunos gestores muestran junto al asunto.
 * `pieExtra` añade una línea al pie (p. ej. el enlace de baja).
 */
export function envolverEmail(opciones: {
  cuerpo: string;
  audiencia: Audiencia;
  titulo?: string;
  preheader?: string;
  pieExtra?: string;
}): string {
  const { cuerpo, audiencia, titulo = "Growwly", preheader, pieExtra } = opciones;
  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@600;700&family=Open+Sans:wght@400;600;700&display=swap" rel="stylesheet">
<title>${titulo}</title>
</head>
<body style="margin:0; padding:0; background:${COLOR.fondo};">
${preheader ? `<div style="display:none; max-height:0; overflow:hidden; opacity:0;">${preheader}</div>` : ""}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${COLOR.fondo};">
<tr><td align="center" style="padding:24px 12px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%; max-width:600px; background:#ffffff; border-radius:24px; overflow:hidden;">
  ${cabeceraEmail()}
  <tr><td style="padding:28px 28px 24px; font-family:${FUENTE}; font-size:15px; line-height:24px; color:${COLOR.tinta};">
    ${cuerpo}
  </td></tr>
  ${pieEmail(audiencia, pieExtra)}
</table>
</td></tr>
</table>
</body>
</html>`;
}
