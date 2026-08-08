"use client";

import {
  TECNICAS_DISPONIBLES,
  IDIOMAS_DISPONIBLES,
  PRECIO_OPCIONES,
  formatearPrecio,
} from "@/lib/clinic-options";
import { getRawSocialValue } from "@/lib/social-links";
import type { Clinic } from "@/lib/supabase/database.types";

type Props = {
  clinic: Clinic;
  action: (formData: FormData) => void;
};

const inputClass =
  "mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-teal/30";
const labelClass = "text-sm font-medium text-ink";

export function FichaClinicaForm({ clinic, action }: Props) {
  return (
    <form action={action} className="flex flex-col gap-8">
      <section>
        <h2 className="font-display text-lg text-teal-dark">Lo básico</h2>
        <div className="mt-4 grid gap-4">
          <div>
            <label className={labelClass} htmlFor="descripcion">
              Descripción
            </label>
            <textarea
              id="descripcion"
              name="descripcion"
              rows={3}
              defaultValue={clinic.descripcion ?? undefined}
              className={inputClass}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass} htmlFor="telefono">
                Teléfono
              </label>
              <input
                id="telefono"
                name="telefono"
                defaultValue={clinic.telefono ?? undefined}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="email">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                defaultValue={clinic.email ?? undefined}
                className={inputClass}
              />
            </div>
          </div>
          <div>
            <label className={labelClass} htmlFor="web">
              Web
            </label>
            <input
              id="web"
              name="web"
              defaultValue={clinic.web ?? undefined}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="direccion">
              Dirección
            </label>
            <input
              id="direccion"
              name="direccion"
              defaultValue={clinic.direccion ?? undefined}
              className={inputClass}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass} htmlFor="ciudad">
                Ciudad
              </label>
              <input
                id="ciudad"
                name="ciudad"
                defaultValue={clinic.ciudad ?? undefined}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="zona">
                Zona/Barrio
              </label>
              <input
                id="zona"
                name="zona"
                defaultValue={clinic.zona ?? undefined}
                className={inputClass}
              />
            </div>
          </div>
        </div>
      </section>

      <section>
        <h2 className="font-display text-lg text-teal-dark">
          Redes sociales
        </h2>
        <div className="mt-4 grid grid-cols-2 gap-4">
          {(["instagram", "facebook", "tiktok"] as const).map((red) => (
            <div key={red}>
              <label className={labelClass} htmlFor={`red_${red}`}>
                {red === "instagram"
                  ? "Instagram"
                  : red === "facebook"
                    ? "Facebook"
                    : "TikTok"}
              </label>
              <input
                id={`red_${red}`}
                name={`red_${red}`}
                placeholder="@usuario"
                defaultValue={
                  getRawSocialValue(clinic.redes_sociales, red) ?? undefined
                }
                className={inputClass}
              />
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-display text-lg text-teal-dark">
          Técnicas e idiomas
        </h2>
        <div className="mt-4">
          <p className={labelClass}>Técnicas que ofrecéis</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {TECNICAS_DISPONIBLES.map((t) => (
              <label
                key={t}
                className="flex items-center gap-1.5 rounded-full border border-line bg-white px-3 py-1.5 text-sm"
              >
                <input
                  type="checkbox"
                  name="tecnicas"
                  value={t}
                  defaultChecked={clinic.tecnicas?.includes(t)}
                />
                {t}
              </label>
            ))}
          </div>
        </div>
        <div className="mt-4">
          <p className={labelClass}>Idiomas de atención</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {IDIOMAS_DISPONIBLES.map((idioma) => (
              <label
                key={idioma}
                className="flex items-center gap-1.5 rounded-full border border-line bg-white px-3 py-1.5 text-sm"
              >
                <input
                  type="checkbox"
                  name="idiomas"
                  value={idioma}
                  defaultChecked={clinic.idiomas?.includes(idioma)}
                />
                {idioma}
              </label>
            ))}
          </div>
        </div>
      </section>

      <section>
        <h2 className="font-display text-lg text-teal-dark">
          Servicios y precios
        </h2>
        <div className="mt-4 grid gap-4">
          <div>
            <label className={labelClass} htmlFor="tipo_negocio">
              Tipo de negocio
            </label>
            <input
              id="tipo_negocio"
              name="tipo_negocio"
              placeholder="Ej. Especializada en capilar / Estética general con capilar"
              defaultValue={clinic.tipo_negocio ?? undefined}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="servicios_adicionales">
              Otros servicios (separados por coma)
            </label>
            <input
              id="servicios_adicionales"
              name="servicios_adicionales"
              defaultValue={clinic.servicios_adicionales?.join(", ") ?? undefined}
              className={inputClass}
            />
          </div>
          <div>
            <p className={labelClass}>Rango de precios</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="precio_desde"
                  className="block text-xs text-ink-soft"
                >
                  Desde
                </label>
                <select
                  id="precio_desde"
                  name="precio_desde"
                  defaultValue={clinic.precio_desde ?? ""}
                  className={inputClass}
                >
                  <option value="">Sin especificar</option>
                  {PRECIO_OPCIONES.map((valor) => (
                    <option key={valor} value={valor}>
                      {formatearPrecio(valor)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  htmlFor="precio_hasta"
                  className="block text-xs text-ink-soft"
                >
                  Hasta
                </label>
                <select
                  id="precio_hasta"
                  name="precio_hasta"
                  defaultValue={clinic.precio_hasta ?? ""}
                  className={inputClass}
                >
                  <option value="">Sin especificar</option>
                  {PRECIO_OPCIONES.map((valor) => (
                    <option key={valor} value={valor}>
                      {formatearPrecio(valor)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          <div>
            <label className={labelClass} htmlFor="rango_precios">
              Notas de precio (opcional)
            </label>
            <input
              id="rango_precios"
              name="rango_precios"
              defaultValue={clinic.rango_precios ?? undefined}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="horarios">
              Horarios
            </label>
            <input
              id="horarios"
              name="horarios"
              defaultValue={clinic.horarios ?? undefined}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="accesibilidad">
              Accesibilidad
            </label>
            <input
              id="accesibilidad"
              name="accesibilidad"
              defaultValue={clinic.accesibilidad ?? undefined}
              className={inputClass}
            />
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-2">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="financiacion"
              defaultChecked={clinic.financiacion}
            />
            Ofrecemos financiación
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="primera_consulta_gratis"
              defaultChecked={clinic.primera_consulta_gratis}
            />
            Primera consulta gratis
          </label>
        </div>
      </section>

      <section>
        <h2 className="font-display text-lg text-teal-dark">
          Oferta activa
        </h2>
        <div className="mt-4">
          <label className={labelClass} htmlFor="detalle_oferta">
            Descríbela aquí (déjalo vacío si no tienes ninguna activa)
          </label>
          <input
            id="detalle_oferta"
            name="detalle_oferta"
            placeholder="Ej. 20% de descuento en primera sesión"
            defaultValue={clinic.detalle_oferta ?? undefined}
            className={inputClass}
          />
        </div>
      </section>

      <div className="flex gap-3 border-t border-line pt-6">
        <button
          type="submit"
          className="rounded-lg bg-teal px-5 py-2.5 text-sm font-medium text-paper hover:bg-teal-dark"
        >
          Guardar cambios
        </button>
      </div>
    </form>
  );
}
