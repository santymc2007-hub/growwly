"use client";

import { useState, useTransition, type FormEvent } from "react";
import { solicitarCitaDirecta } from "@/lib/leads/solicitar-cita-directa";
import { trackEvent } from "@/lib/analytics/events";

/**
 * Único punto de entrada a "pedir cita/presupuesto a esta clínica
 * concreta" — mismo componente, mismo modal y mismo flujo tanto en
 * móvil (barra fija inferior) como en escritorio (botón dentro del
 * aside de Contacto): a propósito no hay un segundo botón ni una
 * segunda Server Action para lo mismo. La petición llega directamente
 * a esta clínica, sin repartirse entre varias ni paywall para quien
 * la envía — lo que varía según el plan de la clínica es si puede ver
 * los datos del paciente (ver crear-solicitud-cita-directa.ts).
 */
export function BotonPedirCita({
  clinicId,
  clinicNombre,
}: {
  clinicId: string;
  clinicNombre: string;
}) {
  const [abierto, setAbierto] = useState(false);
  const [estado, setEstado] = useState<"idle" | "ok" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function cerrar() {
    setAbierto(false);
    setEstado("idle");
    setErrorMsg(null);
  }

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // A propósito NO usamos la prop "action" del <form>: con una
    // función de cliente ahí, React 19 vacía los campos en cuanto
    // termina la acción, también si falla — y entonces, ante un error,
    // el visitante tendría que volver a escribirlo todo. Con
    // preventDefault + FormData manual, los campos solo se limpian
    // cuando nosotros decidimos (al confirmar el envío).
    const formData = new FormData(e.currentTarget);
    formData.set("clinicId", clinicId);
    startTransition(async () => {
      const resultado = await solicitarCitaDirecta(formData);
      if (resultado.ok) {
        setEstado("ok");
        trackEvent("generate_lead", {
          tipo_lead: "cita_directa",
          clinic_id: clinicId,
        });
        // Igual que BotonContactoClinica: registro propio para las
        // estadísticas de la clínica, sin depender de si se aceptaron
        // las cookies analíticas.
        fetch("/api/track/contacto-clinica", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ clinicId, metodo: "pedir_cita" }),
          keepalive: true,
        }).catch(() => {});
      } else {
        setEstado("error");
        setErrorMsg(resultado.error);
      }
    });
  }

  return (
    <>
      <div
        className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white/95 px-4 pt-3 backdrop-blur lg:hidden"
        style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom, 0px))" }}
      >
        <button
          type="button"
          onClick={() => {
            setAbierto(true);
            trackEvent("clic_pedir_cita_directa", { clinic_id: clinicId });
          }}
          className="press block w-full rounded-full bg-yellow px-6 py-3.5 text-center font-display text-base font-bold text-teal-dark shadow-lg shadow-yellow/30 transition hover:opacity-90"
        >
          Pedir cita →
        </button>
      </div>

      <button
        type="button"
        onClick={() => {
          setAbierto(true);
          trackEvent("clic_pedir_cita_directa", { clinic_id: clinicId });
        }}
        className="press mt-5 hidden w-full items-center justify-center rounded-full border-2 border-cyan px-5 py-3 text-center text-sm font-bold text-cyan-dark transition hover:bg-cyan/10 lg:flex"
      >
        Pedir presupuesto a esta clínica →
      </button>

      {abierto && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
          <button
            type="button"
            aria-label="Cerrar"
            onClick={cerrar}
            className="absolute inset-0 bg-ink/85"
          />
          <div className="modal-anim relative z-10 max-h-[90vh] w-full overflow-y-auto rounded-t-3xl bg-white p-6 sm:max-w-md sm:rounded-3xl">
            <button
              type="button"
              onClick={cerrar}
              aria-label="Cerrar"
              className="press absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-sage text-ink hover:bg-sage/70"
            >
              ✕
            </button>

            {estado === "ok" ? (
              <div className="py-6 text-center">
                <p className="font-display text-xl text-teal-dark">¡Solicitud enviada!</p>
                <p className="mt-2 text-sm text-ink-soft">
                  {clinicNombre} ha recibido tu petición y se pondrá en contacto contigo
                  pronto.
                </p>
                <button
                  type="button"
                  onClick={cerrar}
                  className="press mt-5 rounded-full bg-teal-dark px-5 py-2.5 text-sm font-bold text-white"
                >
                  Cerrar
                </button>
              </div>
            ) : (
              <>
                <h2 className="pr-8 font-display text-xl text-teal-dark">
                  Pedir cita en {clinicNombre}
                </h2>
                <p className="mt-1 text-sm text-ink-soft">
                  Déjanos tus datos y la clínica te contactará para concretar la cita.
                </p>

                <form onSubmit={onSubmit} className="mt-5 flex flex-col gap-3">
                  <input
                    type="text"
                    name="nombre"
                    required
                    placeholder="Nombre"
                    className="rounded-xl border border-line px-4 py-2.5 text-sm text-ink outline-none focus:border-cyan"
                  />
                  <input
                    type="tel"
                    name="telefono"
                    required
                    placeholder="Teléfono"
                    className="rounded-xl border border-line px-4 py-2.5 text-sm text-ink outline-none focus:border-cyan"
                  />
                  <input
                    type="email"
                    name="email"
                    placeholder="Email (opcional)"
                    className="rounded-xl border border-line px-4 py-2.5 text-sm text-ink outline-none focus:border-cyan"
                  />
                  <textarea
                    name="mensaje"
                    placeholder="Cuéntanos qué buscas (opcional)"
                    rows={3}
                    className="resize-none rounded-xl border border-line px-4 py-2.5 text-sm text-ink outline-none focus:border-cyan"
                  />

                  <label className="flex items-start gap-2 text-xs text-ink-soft">
                    <input type="checkbox" name="consentimiento" required className="mt-0.5" />
                    <span>
                      Soy mayor de 18 años y acepto que Growwly envíe estos datos a{" "}
                      {clinicNombre} para que me contacte. Si no responde en 48 h,
                      Growwly puede sugerirme otras clínicas por email.{" "}
                      <a
                        href="/legal/privacidad"
                        target="_blank"
                        rel="noopener"
                        className="underline hover:text-teal-dark"
                      >
                        Política de privacidad
                      </a>
                    </span>
                  </label>

                  {estado === "error" && <p className="text-sm text-error">{errorMsg}</p>}

                  <button
                    type="submit"
                    disabled={pending}
                    className="press mt-1 rounded-full bg-yellow px-6 py-3 text-center font-display text-base font-bold text-teal-dark shadow-lg shadow-yellow/30 transition hover:opacity-90 disabled:opacity-60"
                  >
                    {pending ? "Enviando…" : "Enviar solicitud"}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
