import { createAdminClient } from "@/lib/supabase/admin";
import { enviarEmail } from "@/lib/email/resend";
import { esc } from "@/lib/email/escapar";
import { boton, envolverEmail, filaDato, tablaDatos } from "@/lib/email/layout";
import { TIPO_LABEL, type TipoVisibilidad } from "@/lib/visibilidad/tipos";

/**
 * Avisos internos a Santy (petición suya, 23 oct 2026): clínica que se
 * da de alta o reclama su ficha, solicitud de Premium o Destacado, y
 * cada valoración nueva. Nunca rompen el flujo de quien los provoca: si
 * el email falla, se registra y se sigue.
 *
 * Sin datos de salud: de una valoración solo se dice que existe, cómo
 * ha terminado y si la persona tiene cuenta.
 */
const DESTINO = process.env.AVISOS_SANTY_EMAIL || "santymc2007@gmail.com";
const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.growwly.es";

async function enviar(asunto: string, cuerpo: string) {
  try {
    await enviarEmail({
      to: DESTINO,
      subject: asunto,
      html: envolverEmail({ audiencia: "interno", cuerpo }),
    });
  } catch (e) {
    console.error("[aviso-santy]", asunto, e instanceof Error ? e.message : e);
  }
}

async function datosClinica(clinicId: string) {
  const { data } = await createAdminClient()
    .from("clinics")
    .select("nombre, ciudad, plan, publicado")
    .eq("id", clinicId)
    .maybeSingle();
  return data;
}

/** Una clínica se ha dado de alta o ha reclamado su ficha. */
export async function avisarAltaClinica(opciones: {
  clinicId: string;
  autoaprobada: boolean;
  gestor: string | null;
  email: string | null;
}) {
  const c = await datosClinica(opciones.clinicId);
  const nombre = c?.nombre ?? "Clínica";
  const tipo = opciones.autoaprobada ? "Alta de clínica nueva" : "Reclamación de ficha";
  await enviar(
    `${tipo}: ${nombre}`,
    `<p><strong>${tipo}</strong></p>
     <p>${
       opciones.autoaprobada
         ? "Ha creado una clínica que no estaba en el directorio. Su cuenta ya está activa; la ficha no se ve en la web hasta que la verifiques."
         : "Alguien quiere gestionar una ficha que ya estaba en el directorio. Está pendiente de que la apruebes."
     }</p>
     ${tablaDatos(
       filaDato("Clínica", esc(nombre)) +
         filaDato("Ciudad", esc(c?.ciudad ?? "Sin indicar")) +
         filaDato("Gestor", esc(opciones.gestor ?? "Sin nombre")) +
         filaDato("Email", esc(opciones.email ?? "—")),
     )}
     ${boton(`${SITE}/admin/clinicas-cuentas`, opciones.autoaprobada ? "Ver cuentas de clínica" : "Revisar y aprobar")}`,
  );
}

/** Una clínica pide Premium o un Destacado desde su panel. */
export async function avisarSolicitudVisibilidad(opciones: {
  clinicId: string;
  tipo: TipoVisibilidad;
  meses: number | null;
}) {
  const c = await datosClinica(opciones.clinicId);
  const nombre = c?.nombre ?? "Clínica";
  const que = TIPO_LABEL[opciones.tipo] ?? opciones.tipo;
  await enviar(
    `Solicitud de ${que}: ${nombre}`,
    `<p><strong>${esc(nombre)}</strong> ha pedido <strong>${esc(que)}</strong>.</p>
     ${tablaDatos(
       filaDato("Clínica", esc(nombre)) +
         filaDato("Ciudad", esc(c?.ciudad ?? "Sin indicar")) +
         filaDato("Plan actual", c?.plan === "premium" ? "Premium" : "Básico") +
         filaDato("Duración pedida", opciones.meses ? `${opciones.meses} meses` : "Sin fecha de fin"),
     )}
     ${boton(`${SITE}/admin/visibilidad`, "Revisar en Visibilidad")}`,
  );
}

/** Valoración capilar nueva (sin ningún dato de salud). */
export async function avisarNuevaValoracion(opciones: {
  estado: "listo" | "error";
  conCuenta: boolean;
}) {
  const ok = opciones.estado === "listo";
  await enviar(
    ok ? "Nueva valoración capilar" : "Valoración capilar con error",
    `<p><strong>${ok ? "Alguien acaba de hacer una valoración capilar." : "Una valoración capilar ha fallado al analizarse."}</strong></p>
     ${tablaDatos(
       filaDato("Resultado", ok ? "Lista" : "Error en el análisis") +
         filaDato(
           "Persona",
           opciones.conCuenta ? "Con cuenta (ya la puede ver)" : "Sin cuenta (tiene que darse de alta para verla)",
         ) +
         filaDato("Hora", new Date().toLocaleString("es-ES", { timeZone: "Europe/Madrid" })),
     )}
     ${boton(`${SITE}/admin/estadisticas`, "Ver estadísticas")}`,
  );
}
