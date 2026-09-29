import { ConfirmButton } from "@/components/confirm-button";
import {
  proponerFechasCita,
  programarCita,
  marcarCitaRealizada,
  marcarResultadoTratamiento,
} from "@/app/leads/[token]/actions";
import type { EstadoLead } from "@/lib/leads/estados-lead";
import {
  MAX_OPCIONES_CITA,
  fechaCitaLarga,
  isoADatetimeLocalMadrid,
  type OpcionCita,
} from "@/lib/leads/opciones-cita";

const inputClass =
  "mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-teal/30";

function inputDatetimeLocal(fecha: string | null) {
  // El input datetime-local solo acepta "AAAA-MM-DDTHH:mm" (hora de Madrid).
  return fecha ? isoADatetimeLocalMadrid(fecha) : undefined;
}

/** Formulario de hasta 3 fechas para que el paciente elija una. */
function FormularioFechas({
  token,
  opciones,
  boton,
}: {
  token: string;
  opciones: OpcionCita[];
  boton: string;
}) {
  const proponer = proponerFechasCita.bind(null, token);
  return (
    <form action={proponer} className="mt-4 flex flex-col gap-3">
      {Array.from({ length: MAX_OPCIONES_CITA }, (_, i) => {
        const o = opciones[i];
        return (
          <div key={i} className="flex flex-wrap items-end gap-3">
            <div>
              <label className="text-sm font-medium text-ink">
                Opción {i + 1}
                {i === 0 ? "" : " (opcional)"}
              </label>
              <input
                type="datetime-local"
                name={`fecha_${i + 1}`}
                required={i === 0}
                defaultValue={o ? isoADatetimeLocalMadrid(o.fecha) : undefined}
                className={inputClass}
              />
            </div>
            <select
              name={`modalidad_${i + 1}`}
              defaultValue={o?.modalidad ?? "presencial"}
              className={inputClass + " w-auto"}
            >
              <option value="presencial">En clínica</option>
              <option value="videollamada">Videollamada</option>
            </select>
          </div>
        );
      })}
      <button
        type="submit"
        className="self-start rounded-lg bg-teal px-5 py-2.5 text-sm font-medium text-paper transition hover:bg-teal-dark"
      >
        {boton}
      </button>
    </form>
  );
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
  opcionesCita,
  otrasFechasPedidas,
  feedbackPuntuacion,
  feedbackComentario,
}: {
  token: string;
  estado: EstadoLead;
  fechaCita: string | null;
  opcionesCita: OpcionCita[];
  otrasFechasPedidas: boolean;
  feedbackPuntuacion: number | null;
  feedbackComentario: string | null;
}) {
  const programarEstaCita = programarCita.bind(null, token);

  if (estado === "seleccionado") {
    return (
      <div className="mt-8 rounded-xl border border-line bg-white p-6">
        <p className="font-display text-lg text-teal-dark">Propón fechas para la valoración</p>
        <p className="mt-1 text-sm text-ink-soft">
          El paciente te ha elegido. Proponle hasta 3 fechas y él confirmará la que
          mejor le venga desde su cuenta — te avisaremos por email.
        </p>
        <FormularioFechas token={token} opciones={[]} boton="Enviar fechas al paciente" />
      </div>
    );
  }

  if (estado === "cita_pendiente") {
    return (
      <div className="mt-8 rounded-xl border border-line bg-white p-6">
        {otrasFechasPedidas ? (
          <p className="rounded-lg bg-yellow/40 p-3 text-sm font-medium text-teal-dark">
            Ninguna de las fechas le va bien al paciente. Proponle otras.
          </p>
        ) : (
          <>
            <p className="font-display text-lg text-teal-dark">Esperando a que el paciente confirme</p>
            <ul className="mt-2 flex flex-col gap-1 text-sm text-ink">
              {opcionesCita.map((o) => (
                <li key={o.fecha}>
                  {fechaCitaLarga(o.fecha)} ·{" "}
                  {o.modalidad === "videollamada" ? "Videollamada" : "En clínica"}
                </li>
              ))}
            </ul>
          </>
        )}
        {otrasFechasPedidas ? (
          <FormularioFechas token={token} opciones={[]} boton="Enviar nuevas fechas" />
        ) : (
          <details className="mt-4 text-sm">
            <summary className="cursor-pointer font-medium text-ink-soft hover:text-teal-dark">
              Cambiar las fechas
            </summary>
            <FormularioFechas token={token} opciones={opcionesCita} boton="Guardar fechas" />
          </details>
        )}
      </div>
    );
  }

  if (estado === "cita_programada") {
    return (
      <div className="mt-8 rounded-xl border border-line bg-white p-6">
        <p className="font-display text-lg text-teal-dark">Cita programada</p>
        {fechaCita && <p className="mt-1 text-sm text-ink">{fechaCitaLarga(fechaCita)}</p>}

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
