"use client";

import { useState } from "react";
import { enviarFeedback } from "@/app/cuenta/solicitud/actions";

/**
 * Fase 6: valoración del paciente tras la cita — 1 a 5 estrellas +
 * comentario opcional, una sola vez por lead.
 */
export function FeedbackForm({
  solicitudId,
  leadId,
}: {
  solicitudId: string;
  leadId: string;
}) {
  const [puntuacion, setPuntuacion] = useState(0);
  const enviarEsteFeedback = enviarFeedback.bind(null, solicitudId, leadId);

  return (
    <form
      action={enviarEsteFeedback}
      className="mt-4 rounded-xl border border-line bg-white p-5"
    >
      <p className="font-display text-lg text-teal-dark">
        ¿Cómo fue tu experiencia?
      </p>
      <p className="mt-1 text-sm text-ink-soft">
        Tu valoración ayuda a otros pacientes y a la clínica.
      </p>

      <input type="hidden" name="puntuacion" value={puntuacion} />
      <div className="mt-3 flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setPuntuacion(n)}
            aria-label={`${n} estrellas`}
            className={`text-2xl leading-none transition ${
              n <= puntuacion ? "text-yellow" : "text-line hover:text-yellow/60"
            }`}
          >
            ★
          </button>
        ))}
      </div>

      <textarea
        name="comentario"
        rows={3}
        placeholder="Cuéntanos brevemente cómo fue (opcional)"
        className="mt-3 w-full resize-none rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-teal/30"
      />

      <button
        type="submit"
        disabled={puntuacion === 0}
        className="mt-3 rounded-lg bg-teal px-5 py-2.5 text-sm font-medium text-paper transition hover:bg-teal-dark disabled:cursor-not-allowed disabled:opacity-50"
      >
        Enviar valoración
      </button>
    </form>
  );
}
