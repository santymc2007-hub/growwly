"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { confirmarCita, pedirOtrasFechas } from "@/app/cuenta/solicitud/actions";
import { partesFecha, type OpcionCita } from "@/lib/leads/opciones-cita";

export function ElegirFecha({
  solicitudId,
  leadId,
  nombreClinica,
  inicial,
  opciones,
  direccion,
}: {
  solicitudId: string;
  leadId: string;
  nombreClinica: string;
  inicial: string;
  opciones: OpcionCita[];
  direccion: string | null;
}) {
  const [elegida, setElegida] = useState(opciones[0]?.fecha ?? "");
  const confirmar = confirmarCita.bind(null, solicitudId, leadId);
  const pedirOtras = pedirOtrasFechas.bind(null, solicitudId, leadId);

  return (
    <section className="flex flex-col gap-5 rounded-3xl border border-line p-6 sm:p-8">
      <div className="flex items-center gap-4">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-sage font-display text-[22px] font-extrabold text-sage-ink">
          {inicial}
        </span>
        <div className="flex flex-col gap-1">
          <h2 className="font-display text-2xl font-extrabold text-teal-dark">
            Elige fecha para tu valoración
          </h2>
          <span className="text-[15px] text-ink-soft">
            {nombreClinica} te propone {opciones.length === 1 ? "esta opción" : "estas opciones"}
          </span>
        </div>
      </div>

      <form action={confirmar} className="flex flex-col gap-5">
        <div className="flex flex-col gap-3" role="radiogroup">
          {opciones.map((o) => {
            const p = partesFecha(o.fecha);
            const activa = elegida === o.fecha;
            return (
              <label
                key={o.fecha}
                className={`flex cursor-pointer items-center gap-4 rounded-[18px] px-4 py-4 sm:gap-5 sm:px-5 ${
                  activa ? "border-2 border-yellow bg-[#fdfee8]" : "border border-line bg-[#f4f9f7]"
                }`}
              >
                <input
                  type="radio"
                  name="fecha"
                  value={o.fecha}
                  checked={activa}
                  onChange={() => setElegida(o.fecha)}
                  className="sr-only"
                />
                <span
                  aria-hidden
                  className={`h-6 w-6 shrink-0 rounded-full bg-white ${
                    activa ? "border-[7px] border-teal-dark" : "border-2 border-[#b9c9c4]"
                  }`}
                />
                <span className="flex w-16 shrink-0 flex-col items-center rounded-xl border border-line bg-white py-2">
                  <span className="text-xs font-bold uppercase text-teal">{p.dia}</span>
                  <span className="font-display text-2xl font-extrabold leading-none text-teal-dark">
                    {p.num}
                  </span>
                  <span className="text-xs text-ink-soft">{p.mes}</span>
                </span>
                <span className="flex flex-col gap-0.5">
                  <span className="font-display text-xl font-bold text-teal-dark">{p.hora}</span>
                  <span className="text-sm text-ink-soft">
                    {o.modalidad === "videollamada"
                      ? "Videollamada"
                      : `En clínica${direccion ? ` · ${direccion}` : ""}`}
                  </span>
                </span>
              </label>
            );
          })}
        </div>

        <div className="flex flex-col-reverse items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="submit"
            formAction={pedirOtras}
            formNoValidate
            className="text-sm font-semibold text-teal hover:text-teal-dark"
          >
            Ninguna me va bien, pedir otras fechas
          </button>
          <BotonConfirmar />
        </div>
      </form>

      <p className="flex items-center gap-2.5 text-sm text-sage-ink">
        <span className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full bg-sage font-extrabold">
          ✓
        </span>
        {nombreClinica} ya tiene tus datos de contacto. El resto de clínicas ya no ven tu
        solicitud.
      </p>
    </section>
  );
}

function BotonConfirmar() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="press h-[52px] rounded-full bg-yellow px-8 font-display text-[17px] font-bold text-teal-dark shadow-[0_10px_15px_-3px_rgba(232,239,45,0.3)] hover:opacity-90 disabled:opacity-60"
    >
      {pending ? "Confirmando…" : "Confirmar cita"}
    </button>
  );
}
