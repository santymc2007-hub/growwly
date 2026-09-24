"use client";

import { useState } from "react";
import { guardarPropuesta } from "@/app/leads/[token]/actions";
import { TIPO_PRECIO_LABEL, TIPO_CONSULTA_LABEL, INCLUYE_OPCIONES } from "@/lib/leads/propuesta-options";
import type { Database } from "@/lib/supabase/database.types";

type Propuesta = Database["public"]["Tables"]["propuestas_clinica"]["Row"];

const inputClass =
  "mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-teal/30";

/**
 * "Responder con propuesta" (Fase 4): estructura + texto libre, en vez
 * de un campo 100% libre — así las propuestas de distintas clínicas se
 * pueden comparar de un vistazo cuando el paciente las vea (Fase 5),
 * sin dejar de tener sitio para que cada clínica explique su caso.
 */
export function PropuestaForm({
  token,
  tratamientoSugerido,
  propuestaExistente,
}: {
  token: string;
  tratamientoSugerido: string;
  propuestaExistente: Propuesta | null;
}) {
  const guardarEstaPropuesta = guardarPropuesta.bind(null, token);
  const [tipoPrecio, setTipoPrecio] = useState(propuestaExistente?.tipo_precio ?? "rango");

  return (
    <div className="mt-8 rounded-xl border border-line bg-white p-6">
      <p className="font-display text-lg text-teal-dark">
        {propuestaExistente ? "Tu propuesta" : "Responder con propuesta"}
      </p>
      <p className="mt-1 text-sm text-ink-soft">
        {propuestaExistente
          ? "Puedes editarla mientras el paciente no haya elegido todavía."
          : "Una propuesta orientativa — el paciente sabe que un presupuesto médico definitivo requiere valorar su caso en persona."}
      </p>

      <form action={guardarEstaPropuesta} className="mt-5 flex flex-col gap-4">
        <div>
          <label className="text-sm font-medium text-ink">Tratamiento propuesto</label>
          <input
            type="text"
            name="tratamiento"
            defaultValue={propuestaExistente?.tratamiento ?? tratamientoSugerido}
            placeholder="Ej. Injerto capilar FUE"
            className={inputClass}
          />
        </div>

        <div>
          <label className="text-sm font-medium text-ink">Precio</label>
          <div className="mt-1 flex flex-wrap gap-3">
            {Object.entries(TIPO_PRECIO_LABEL).map(([valor, etiqueta]) => (
              <label key={valor} className="flex items-center gap-1.5 text-sm text-ink">
                <input
                  type="radio"
                  name="tipo_precio"
                  value={valor}
                  required
                  checked={tipoPrecio === valor}
                  onChange={() => setTipoPrecio(valor)}
                />
                {etiqueta}
              </label>
            ))}
          </div>

          {tipoPrecio !== "valoracion" && (
            <div className="mt-2 flex items-center gap-2">
              <input
                type="number"
                name="precio_min"
                min={0}
                step={50}
                placeholder={tipoPrecio === "rango" ? "Desde" : "€"}
                defaultValue={propuestaExistente?.precio_min ?? undefined}
                className={`${inputClass} mt-0 w-32`}
              />
              {tipoPrecio === "rango" && (
                <>
                  <span className="text-sm text-ink-soft">–</span>
                  <input
                    type="number"
                    name="precio_max"
                    min={0}
                    step={50}
                    placeholder="Hasta"
                    defaultValue={propuestaExistente?.precio_max ?? undefined}
                    className={`${inputClass} mt-0 w-32`}
                  />
                </>
              )}
              <span className="text-sm text-ink-soft">€</span>
            </div>
          )}
        </div>

        <div>
          <label className="text-sm font-medium text-ink">Qué incluye</label>
          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1.5">
            {INCLUYE_OPCIONES.map(({ clave, etiqueta }) => (
              <label key={clave} className="flex items-center gap-1.5 text-sm text-ink">
                <input
                  type="checkbox"
                  name="incluye"
                  value={clave}
                  defaultChecked={propuestaExistente?.incluye.includes(clave) ?? false}
                />
                {etiqueta}
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-ink">Primera cita</label>
          <div className="mt-1 flex flex-wrap gap-3">
            {Object.entries(TIPO_CONSULTA_LABEL).map(([valor, etiqueta]) => (
              <label key={valor} className="flex items-center gap-1.5 text-sm text-ink">
                <input
                  type="radio"
                  name="tipo_consulta"
                  value={valor}
                  defaultChecked={propuestaExistente?.tipo_consulta === valor}
                />
                {etiqueta}
              </label>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-ink">Disponibilidad aproximada</label>
            <input
              type="text"
              name="disponibilidad"
              defaultValue={propuestaExistente?.disponibilidad ?? ""}
              placeholder="Ej. Esta semana"
              className={inputClass}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-ink">Válida hasta (opcional)</label>
            <input
              type="date"
              name="valido_hasta"
              defaultValue={propuestaExistente?.valido_hasta ?? ""}
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-ink">Mensaje para el paciente</label>
          <textarea
            name="mensaje"
            rows={4}
            defaultValue={propuestaExistente?.mensaje ?? ""}
            placeholder="Hola, por las fotografías creemos que sería interesante valorar..."
            className={`${inputClass} resize-none`}
          />
        </div>

        <button
          type="submit"
          className="mt-1 self-start rounded-lg bg-teal px-5 py-2.5 text-sm font-medium text-paper transition hover:bg-teal-dark"
        >
          {propuestaExistente ? "Actualizar propuesta" : "Enviar propuesta"}
        </button>
      </form>
    </div>
  );
}
