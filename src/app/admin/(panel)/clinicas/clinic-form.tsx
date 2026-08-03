import Image from "next/image";
import { TECNICAS_DISPONIBLES, IDIOMAS_DISPONIBLES } from "@/lib/clinic-options";
import { getRawSocialValue } from "@/lib/social-links";
import type { Clinic } from "@/lib/supabase/database.types";

type ClinicFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  clinic?: Clinic;
  error?: string;
};

const inputClass =
  "mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-teal/30";
const labelClass = "text-sm font-medium text-ink";

export function ClinicForm({ action, clinic, error }: ClinicFormProps) {
  return (
    <form action={action} className="max-w-2xl">
      {error && (
        <p className="mb-6 rounded-lg bg-error/10 px-4 py-3 text-sm text-error-dark">
          {decodeURIComponent(error)}
        </p>
      )}

      <section>
        <h2 className="font-display text-lg text-teal-dark">Datos básicos</h2>
        <div className="mt-4 grid gap-4">
          <div>
            <label className={labelClass} htmlFor="nombre">
              Nombre *
            </label>
            <input
              id="nombre"
              name="nombre"
              required
              defaultValue={clinic?.nombre}
              className={inputClass}
            />
            {!clinic && (
              <p className="mt-1 text-xs text-ink-soft">
                La URL pública se genera sola a partir del nombre (ej. /clinicas/mi-clinica).
              </p>
            )}
          </div>
          <div>
            <label className={labelClass} htmlFor="descripcion">
              Descripción
            </label>
            <textarea
              id="descripcion"
              name="descripcion"
              rows={3}
              defaultValue={clinic?.descripcion ?? undefined}
              className={inputClass}
            />
          </div>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="font-display text-lg text-teal-dark">Fotos</h2>

        {clinic && clinic.fotos.length > 0 && (
          <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4">
            {clinic.fotos.map((foto) => (
              <div key={foto}>
                <div className="relative aspect-square overflow-hidden rounded-lg border border-line bg-sage">
                  <Image
                    src={foto}
                    alt=""
                    fill
                    sizes="120px"
                    className="object-cover"
                  />
                </div>
                <label className="mt-1 flex items-center gap-1.5 text-xs text-ink-soft">
                  <input type="checkbox" name="fotos_eliminar" value={foto} />
                  Eliminar
                </label>
              </div>
            ))}
          </div>
        )}

        {clinic && (
          <input
            type="hidden"
            name="fotos_actuales"
            value={JSON.stringify(clinic.fotos)}
          />
        )}

        <div className="mt-4">
          <label className={labelClass} htmlFor="fotos_nuevas">
            {clinic ? "Añadir fotos nuevas" : "Fotos"}
          </label>
          <input
            id="fotos_nuevas"
            name="fotos_nuevas"
            type="file"
            accept="image/*"
            multiple
            className="mt-1 block w-full text-sm text-ink-soft file:mr-3 file:rounded-lg file:border-0 file:bg-sage file:px-3 file:py-2 file:text-sm file:font-medium file:text-sage-ink"
          />
        </div>
      </section>

      <section className="mt-8">
        <h2 className="font-display text-lg text-teal-dark">Ubicación</h2>
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className={labelClass} htmlFor="direccion">
              Dirección
            </label>
            <input
              id="direccion"
              name="direccion"
              defaultValue={clinic?.direccion ?? undefined}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="comunidad_autonoma">
              Comunidad autónoma
            </label>
            <input
              id="comunidad_autonoma"
              name="comunidad_autonoma"
              defaultValue={clinic?.comunidad_autonoma ?? undefined}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="provincia">
              Provincia
            </label>
            <input
              id="provincia"
              name="provincia"
              defaultValue={clinic?.provincia ?? undefined}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="ciudad">
              Ciudad
            </label>
            <input
              id="ciudad"
              name="ciudad"
              defaultValue={clinic?.ciudad ?? undefined}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="zona">
              Zona / barrio
            </label>
            <input
              id="zona"
              name="zona"
              defaultValue={clinic?.zona ?? undefined}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="lat">
              Latitud
            </label>
            <input
              id="lat"
              name="lat"
              type="number"
              step="any"
              defaultValue={clinic?.lat ?? undefined}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="lng">
              Longitud
            </label>
            <input
              id="lng"
              name="lng"
              type="number"
              step="any"
              defaultValue={clinic?.lng ?? undefined}
              className={inputClass}
            />
          </div>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="font-display text-lg text-teal-dark">Contacto</h2>
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass} htmlFor="telefono">
              Teléfono
            </label>
            <input
              id="telefono"
              name="telefono"
              defaultValue={clinic?.telefono ?? undefined}
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
              defaultValue={clinic?.email ?? undefined}
              className={inputClass}
            />
          </div>
          <div className="col-span-2">
            <label className={labelClass} htmlFor="web">
              Sitio web
            </label>
            <input
              id="web"
              name="web"
              type="url"
              placeholder="https://"
              defaultValue={clinic?.web ?? undefined}
              className={inputClass}
            />
          </div>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="font-display text-lg text-teal-dark">Otros datos</h2>
        <div className="mt-4 grid gap-4">
          <div>
            <label className={labelClass} htmlFor="rango_precios">
              Rango de precios
            </label>
            <input
              id="rango_precios"
              name="rango_precios"
              defaultValue={clinic?.rango_precios ?? undefined}
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
              defaultValue={clinic?.horarios ?? undefined}
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
              defaultValue={clinic?.accesibilidad ?? undefined}
              className={inputClass}
            />
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <label className={labelClass} htmlFor="rating_google">
              Nota Google
            </label>
            <input
              id="rating_google"
              name="rating_google"
              type="number"
              step="0.1"
              min="0"
              max="5"
              defaultValue={clinic?.rating_google ?? undefined}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="resenas_google">
              Reseñas Google
            </label>
            <input
              id="resenas_google"
              name="resenas_google"
              type="number"
              min="0"
              defaultValue={clinic?.resenas_google ?? undefined}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="rating_doctoralia">
              Nota Doctoralia
            </label>
            <input
              id="rating_doctoralia"
              name="rating_doctoralia"
              type="number"
              step="0.1"
              min="0"
              max="5"
              defaultValue={clinic?.rating_doctoralia ?? undefined}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="resenas_doctoralia">
              Reseñas Doctoralia
            </label>
            <input
              id="resenas_doctoralia"
              name="resenas_doctoralia"
              type="number"
              min="0"
              defaultValue={clinic?.resenas_doctoralia ?? undefined}
              className={inputClass}
            />
          </div>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="font-display text-lg text-teal-dark">
          Redes sociales
        </h2>
        <p className="mt-1 text-xs text-ink-soft">
          Solo el usuario/handle, sin la URL completa (ej. "raizcapilarmadrid").
        </p>
        <div className="mt-4 grid grid-cols-3 gap-4">
          <div>
            <label className={labelClass} htmlFor="red_instagram">
              Instagram
            </label>
            <input
              id="red_instagram"
              name="red_instagram"
              defaultValue={getRawSocialValue(
                clinic?.redes_sociales ?? null,
                "instagram",
              )}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="red_facebook">
              Facebook
            </label>
            <input
              id="red_facebook"
              name="red_facebook"
              defaultValue={getRawSocialValue(
                clinic?.redes_sociales ?? null,
                "facebook",
              )}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="red_tiktok">
              TikTok
            </label>
            <input
              id="red_tiktok"
              name="red_tiktok"
              defaultValue={getRawSocialValue(
                clinic?.redes_sociales ?? null,
                "tiktok",
              )}
              className={inputClass}
            />
          </div>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="font-display text-lg text-teal-dark">Técnicas</h2>
        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
          {TECNICAS_DISPONIBLES.map((tecnica) => (
            <label key={tecnica} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="tecnicas"
                value={tecnica}
                defaultChecked={clinic?.tecnicas.includes(tecnica)}
              />
              {tecnica}
            </label>
          ))}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="font-display text-lg text-teal-dark">Idiomas</h2>
        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
          {IDIOMAS_DISPONIBLES.map((idioma) => (
            <label key={idioma} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="idiomas"
                value={idioma}
                defaultChecked={clinic?.idiomas.includes(idioma)}
              />
              {idioma}
            </label>
          ))}
        </div>
      </section>

      <section className="mt-8 flex flex-col gap-3">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="primera_consulta_gratis"
            defaultChecked={clinic?.primera_consulta_gratis}
          />
          Primera consulta gratis
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="financiacion"
            defaultChecked={clinic?.financiacion}
          />
          Ofrece financiación
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="verificado"
            defaultChecked={clinic?.verificado}
          />
          Verificada por Growwly{" "}
          <span className="text-xs text-ink-soft">(solo uso interno)</span>
        </label>
      </section>

      <div className="mt-10 flex gap-3">
        <button
          type="submit"
          className="rounded-lg bg-teal px-5 py-2.5 text-sm font-medium text-paper hover:bg-teal-dark"
        >
          {clinic ? "Guardar cambios" : "Crear clínica"}
        </button>
      </div>
    </form>
  );
}
