import { ConfirmButton } from "@/components/confirm-button";
import {
  programarCita,
  marcarCitaRealizada,
  marcarResultadoTratamiento,
} from "@/app/leads/[token]/actions";
import type { EstadoLead } from "@/lib/leads/estados-lead";

const inputClass =
  "mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-teal/30";

function formatearFecha(fecha: string) {
  return new Date(fecha).toLocaleString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function inputDatetimeLocal(fecha: string | null) {
  // El input datetime-local solo acepta "AAAA-MM-DDTHH:mm", sin segundos ni zona.
  return fecha ? fecha.slice(0, 16) : undefined;
}

/**
 * Fase 6: seguimiento de la cita tras ser elegida — programarla,
 * confirmar que tuvo lugar y cerrar el resultado. Sin calendario
 * externo conectado (fuera de alcance del V1): la fecha la guarda la
 * propia clínica a mano.
 */
export function CitaSeguimiento({
  token,
  estado,
  fechaCita,
  feedbackPuntuacion,
  feedbackComentario,
}: {
  token: string;
  estado: EstadoLead;
  fechaCita: string | null;
  feedbackPuntuacion: number | null;
  feedbackComentario: string | null;
}) {
  const programarEstaCita = programarCita.bind(null, token);

  if (estado === "seleccionado") {
    return (
      <div className="mt-8 rounded-xl border border-line bg-white p-6">
        <p className="font-display text-lg text-teal-dark">Programa la cita</p>
        <p className="mt-1 text-sm text-ink-soft">
          El paciente ya sabe que le has elegido — guarda aquí la fecha en la
          que habéis quedado.
        </p>
        <form action={programarEstaCita} className="mt-4 flex flex-wrap items-end gap-3">
          <div>
            <label className="text-sm font-medium text-ink">Fecha y hora</label>
            <input type="datetime-local" name="fecha_cita" required className={inputClass} />
          </div>
          <button
            type="submit"
            className="rounded-lg bg-teal px-5 py-2.5 text-sm font-medium text-paper transition hover:bg-teal-dark"
          >
            Guardar
          </button>
        </form>
      </div>
    );
  }

  if (estado === "cita_pendiente") {
    return (
      <div className="mt-8 rounded-xl bg-sage/60 p-4 text-sm text-sage-ink">
        Concretando la fecha de la cita con el paciente.
      </div>
    );
  }

  if (estado === "cita_programada") {
    return (
      <div className="mt-8 rounded-xl border border-line bg-white p-6">
        <p className="font-display text-lg text-teal-dark">Cita programada</p>
        {fechaCita && <p className="mt-1 text-sm text-ink">{formatearFecha(fechaCita)}</p>}

        <div className="mt-4">
          <ConfirmButton
            action={marcarCitaRealizada.bind(null, token)}
            triggerLabel="Marcar cita realizada"
            title="¿Confirmas que la cita ya tuvo lugar?"
            message="Después podrás indicar si el paciente siguió adelante con el tratamiento."
            confirmLabel="Sí, ya se realizó"
            triggerClassName="rounded-lg bg-teal px-5 py-2.5 text-sm font-medium text-paper transition hover:bg-teal-dark"
          />
        </div>

        <details className="mt-4 text-sm">
          <summary className="cursor-pointer font-medium text-ink-soft hover:text-teal-dark">
            Cambiar la fecha
          </summary>
          <form action={programarEstaCita} className="mt-3 flex flex-wrap items-end gap-3">
            <input
              type="datetime-local"
              name="fecha_cita"
              required
              defaultValue={inputDatetimeLocal(fechaCita)}
              className={inputClass}
            />
            <button
              type="submit"
              className="rounded-lg border border-line px-4 py-2 text-sm font-medium text-ink transition hover:border-teal/40"
            >
              Guardar nueva fecha
            </button>
          </form>
        </details>
      </div>
    );
  }

  if (estado === "cita_realizada") {
    return (
      <div className="mt-8 rounded-xl border border-line bg-white p-6">
        <p className="font-display text-lg text-teal-dark">¿Cómo quedó?</p>
        <p className="mt-1 text-sm text-ink-soft">
          Indica si el paciente siguió adelante con el tratamiento — nos
          ayuda a ajustar qué leads encajan mejor contigo.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <ConfirmButton
            action={marcarResultadoTratamiento.bind(null, token, "convertido")}
            triggerLabel="Sí, siguió adelante"
            title="¿Confirmas que el paciente hizo el tratamiento?"
            message="Este lead se marcará como convertido."
            confirmLabel="Sí, confirmar"
            triggerClassName="rounded-lg bg-teal px-5 py-2.5 text-sm font-medium text-paper transition hover:bg-teal-dark"
          />
          <ConfirmButton
            action={marcarResultadoTratamiento.bind(null, token, "no_convertido")}
            triggerLabel="No siguió adelante"
            title="¿Confirmas que el paciente no siguió adelante?"
            message="Este lead se marcará como no convertido."
            confirmLabel="Sí, confirmar"
            triggerClassName="text-sm font-medium text-ink-soft hover:text-error"
          />
        </div>
      </div>
    );
  }

  if (estado === "convertido" || estado === "no_convertido") {
    return (
      <div className="mt-8 rounded-xl bg-sage p-6">
        <p className="font-display text-lg text-sage-ink">
          {estado === "convertido" ? "Tratamiento realizado" : "No convertido"}
        </p>
        <p className="mt-1 text-sm text-sage-ink/80">
          {estado === "convertido"
            ? "El paciente completó el tratamiento con vosotros."
            : "El paciente no siguió adelante tras la cita."}
        </p>
        {feedbackPuntuacion != null && (
          <div className="mt-3 rounded-lg bg-white/70 p-3 text-sm text-ink">
            <p className="font-medium">Valoración del paciente: {feedbackPuntuacion}/5</p>
            {feedbackComentario && <p className="mt-1">{feedbackComentario}</p>}
          </div>
        )}
      </div>
    );
  }

  return null;
}
