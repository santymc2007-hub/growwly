type EnviarEmailInput = {
  /** Uno o varios destinatarios (p. ej. los emails de leads de una clínica). */
  to: string | string[];
  subject: string;
  html: string;
  /** Dirección a la que llegan las respuestas (si no, la del remitente). */
  replyTo?: string;
};

export async function enviarEmail({ to, subject, html, replyTo }: EnviarEmailInput) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("Falta configurar RESEND_API_KEY para poder enviar emails.");
  }

  // "onboarding@resend.dev" funciona sin verificar dominio, pero Resend
  // solo deja mandar con él a tu propio email de prueba. Para avisar a
  // clínicas de verdad hace falta un dominio propio verificado en Resend
  // y poner esa dirección aquí, vía RESEND_FROM_EMAIL.
  const from = process.env.RESEND_FROM_EMAIL || "Growwly <onboarding@resend.dev>";

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ from, to, subject, html, ...(replyTo ? { reply_to: replyTo } : {}) }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Error al enviar email (${response.status}): ${detail}`);
  }

  return response.json();
}
