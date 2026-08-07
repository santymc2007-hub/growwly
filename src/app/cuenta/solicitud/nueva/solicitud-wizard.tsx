"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { crearSolicitud } from "../actions";
import { TRATAMIENTOS_INFO } from "@/lib/tratamientos-info";
import type { Profile, EstudioCapilar } from "@/lib/supabase/database.types";

type Props = {
  profile: Profile | null;
  estudios: Pick<
    EstudioCapilar,
    "id" | "created_at" | "norwood_estimado" | "estado"
  >[];
};

const TOTAL_PASOS = 6;

const inputClass =
  "mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-teal/30";
const labelClass = "text-sm font-medium text-ink";

export function SolicitudWizard({ profile, estudios }: Props) {
  const router = useRouter();
  const [paso, setPaso] = useState(1);
  const [enviando, setEnviando] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState<string | null>(null);

  const estudiosListos = estudios.filter((e) => e.estado === "listo");
  const [estudioId, setEstudioId] = useState<string | null>(
    estudiosListos[0]?.id ?? null,
  );

  const [progresionPerdida, setProgresionPerdida] = useState("");
  const [antecedentesFamiliares, setAntecedentesFamiliares] = useState("");
  const [medicacionActual, setMedicacionActual] = useState("");

  const [tratamientosInteres, setTratamientosInteres] = useState<string[]>(
    [],
  );
  const [dejarDecidirMedico, setDejarDecidirMedico] = useState(false);

  const [cuandoTratamiento, setCuandoTratamiento] = useState("");
  const [dondeTratamiento, setDondeTratamiento] = useState("");
  const [presupuestoRango, setPresupuestoRango] = useState("");

  const [consentimientoDatos, setConsentimientoDatos] = useState(false);
  const [consentimientoCompartir, setConsentimientoCompartir] =
    useState(false);

  function toggleTratamiento(nombre: string) {
    setTratamientosInteres((prev) =>
      prev.includes(nombre)
        ? prev.filter((t) => t !== nombre)
        : [...prev, nombre],
    );
  }

  function siguiente() {
    setPaso((p) => Math.min(p + 1, TOTAL_PASOS));
  }
  function anterior() {
    setPaso((p) => Math.max(p - 1, 1));
  }

  async function enviar() {
    setEnviando(true);
    setErrorEnvio(null);
    const resultado = await crearSolicitud({
      estudioId,
      progresionPerdida,
      antecedentesFamiliares,
      medicacionActual,
      tratamientosInteres,
      dejarDecidirMedico,
      cuandoTratamiento,
      dondeTratamiento,
      presupuestoRango,
      consentimientoDatos,
      consentimientoCompartir,
    });

    if ("error" in resultado) {
      setErrorEnvio(resultado.error);
      setEnviando(false);
      return;
    }

    router.push(`/cuenta/solicitud/${resultado.id}`);
  }

  return (
    <div>
      <div className="mb-6 flex items-center gap-1.5">
        {Array.from({ length: TOTAL_PASOS }, (_, i) => i + 1).map((n) => (
          <div
            key={n}
            className={`h-1.5 flex-1 rounded-full ${
              n <= paso ? "bg-teal" : "bg-line"
            }`}
          />
        ))}
      </div>
      <p className="mb-4 text-xs font-medium uppercase tracking-wide text-ink-soft">
        Paso {paso} de {TOTAL_PASOS}
      </p>

      {paso === 1 && (
        <section>
          <h2 className="font-display text-lg text-teal-dark">
            Tus datos de contacto
          </h2>
          <p className="mt-1 text-sm text-ink-soft">
            Los usaremos para que las clínicas puedan responderte. Los
            puedes actualizar desde{" "}
            <a href="/cuenta" className="text-cyan hover:text-cyan-dark">
              Mi cuenta
            </a>{" "}
            si algo no es correcto.
          </p>
          <div className="mt-4 grid grid-cols-2 gap-3 rounded-lg border border-line bg-white p-4 text-sm">
            <div>
              <p className="text-xs text-ink-soft">Nombre</p>
              <p className="text-ink">
                {profile?.nombre || "—"} {profile?.apellidos ?? ""}
              </p>
            </div>
            <div>
              <p className="text-xs text-ink-soft">Edad</p>
              <p className="text-ink">{profile?.edad ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs text-ink-soft">Teléfono</p>
              <p className="text-ink">{profile?.telefono || "—"}</p>
            </div>
            <div>
              <p className="text-xs text-ink-soft">Email</p>
              <p className="text-ink">{profile?.email}</p>
            </div>
          </div>

          {estudiosListos.length > 0 && (
            <div className="mt-4">
              <label className={labelClass}>
                Vincular a un análisis ya hecho (opcional)
              </label>
              <select
                value={estudioId ?? ""}
                onChange={(e) => setEstudioId(e.target.value || null)}
                className={inputClass}
              >
                <option value="">No vincular ninguno</option>
                {estudiosListos.map((e) => (
                  <option key={e.id} value={e.id}>
                    Análisis del{" "}
                    {new Date(e.created_at).toLocaleDateString("es-ES")}
                    {e.norwood_estimado ? ` · ${e.norwood_estimado}` : ""}
                  </option>
                ))}
              </select>
            </div>
          )}
        </section>
      )}

      {paso === 2 && (
        <section>
          <h2 className="font-display text-lg text-teal-dark">
            Historial capilar
          </h2>
          <div className="mt-4 flex flex-col gap-4">
            <div>
              <label className={labelClass}>
                ¿Cómo describirías la progresión de tu pérdida de cabello?
              </label>
              <select
                value={progresionPerdida}
                onChange={(e) => setProgresionPerdida(e.target.value)}
                className={inputClass}
              >
                <option value="">Selecciona una opción</option>
                <option value="lenta">Lenta</option>
                <option value="moderada">Moderada</option>
                <option value="rapida">Rápida</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>
                Antecedentes familiares con alopecia
              </label>
              <textarea
                value={antecedentesFamiliares}
                onChange={(e) => setAntecedentesFamiliares(e.target.value)}
                rows={2}
                placeholder="Ej. mi padre y mi abuelo materno"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>
                Medicación actual para el cabello
              </label>
              <textarea
                value={medicacionActual}
                onChange={(e) => setMedicacionActual(e.target.value)}
                rows={2}
                placeholder="Ej. minoxidil desde hace 1 año, o ninguna"
                className={inputClass}
              />
            </div>
          </div>
        </section>
      )}

      {paso === 3 && (
        <section>
          <h2 className="font-display text-lg text-teal-dark">
            Tratamientos que te interesan
          </h2>
          <p className="mt-1 text-sm text-ink-soft">
            Puedes elegir varios, o dejar que la clínica te recomiende.
          </p>
          <div className="mt-4 flex flex-col gap-2">
            {TRATAMIENTOS_INFO.map((t) => (
              <label
                key={t.nombre}
                title={t.descripcion}
                className="flex items-start gap-2 rounded-lg border border-line bg-white p-3 text-sm hover:border-teal/40"
              >
                <input
                  type="checkbox"
                  checked={tratamientosInteres.includes(t.nombre)}
                  onChange={() => toggleTratamiento(t.nombre)}
                  className="mt-0.5"
                />
                <span>
                  <span className="font-medium text-ink">{t.nombre}</span>
                  <span className="block text-xs text-ink-soft">
                    {t.descripcion}
                  </span>
                </span>
              </label>
            ))}
          </div>
          <label className="mt-3 flex items-center gap-2 rounded-lg bg-sage px-3 py-2.5 text-sm font-medium text-sage-ink">
            <input
              type="checkbox"
              checked={dejarDecidirMedico}
              onChange={(e) => setDejarDecidirMedico(e.target.checked)}
            />
            Dejo que el médico decida la mejor técnica para mi caso
          </label>
        </section>
      )}

      {paso === 4 && (
        <section>
          <h2 className="font-display text-lg text-teal-dark">
            Tiempo, lugar y presupuesto
          </h2>
          <div className="mt-4 flex flex-col gap-4">
            <div>
              <label className={labelClass}>
                ¿Cuándo planeas el tratamiento?
              </label>
              <select
                value={cuandoTratamiento}
                onChange={(e) => setCuandoTratamiento(e.target.value)}
                className={inputClass}
              >
                <option value="">Selecciona una opción</option>
                <option value="inmediatamente">Inmediatamente</option>
                <option value="3_meses">En los próximos 3 meses</option>
                <option value="este_anio">
                  Lo estoy pensando — este año
                </option>
              </select>
            </div>
            <div>
              <label className={labelClass}>¿Dónde te lo realizarías?</label>
              <select
                value={dondeTratamiento}
                onChange={(e) => setDondeTratamiento(e.target.value)}
                className={inputClass}
              >
                <option value="">Selecciona una opción</option>
                <option value="solo_ciudad">
                  Solo en mi ciudad/provincia
                </option>
                <option value="abierto_viajar">
                  Estoy abierto/a a viajar por una buena oferta
                </option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Presupuesto aproximado</label>
              <select
                value={presupuestoRango}
                onChange={(e) => setPresupuestoRango(e.target.value)}
                className={inputClass}
              >
                <option value="">Selecciona una opción</option>
                <option value="menos_3000">Menos de 3.000€</option>
                <option value="3000_5000">3.000€ - 5.000€</option>
                <option value="5000_7000">5.000€ - 7.000€</option>
                <option value="mas_7000">Más de 7.000€</option>
              </select>
            </div>
          </div>
        </section>
      )}

      {paso === 5 && (
        <section>
          <h2 className="font-display text-lg text-teal-dark">
            Fotografías
          </h2>
          {estudiosListos.length > 0 ? (
            <div className="mt-4 rounded-lg border border-line bg-white p-4 text-sm">
              <p className="text-ink">
                Usaremos las fotos de tu análisis
                {estudioId ? " ya vinculado" : ""}. Puedes cambiarlo en el
                paso 1.
              </p>
            </div>
          ) : (
            <div className="mt-4 rounded-lg border border-dashed border-line bg-white p-4 text-sm">
              <p className="text-ink-soft">
                Todavía no tienes fotos subidas. Puedes continuar sin ellas,
                pero ayudan mucho a que las clínicas valoren tu caso.
              </p>
              <a
                href="/cuenta/analisis/nuevo"
                className="mt-2 inline-block text-sm font-medium text-cyan hover:text-cyan-dark"
              >
                Subir fotos ahora →
              </a>
            </div>
          )}
        </section>
      )}

      {paso === 6 && (
        <section>
          <h2 className="font-display text-lg text-teal-dark">
            Últimos consentimientos
          </h2>
          <div className="mt-4 flex flex-col gap-3">
            <label className="flex items-start gap-2 rounded-lg border border-line bg-white p-3 text-sm">
              <input
                type="checkbox"
                checked={consentimientoDatos}
                onChange={(e) => setConsentimientoDatos(e.target.checked)}
                className="mt-0.5"
                required
              />
              Doy mi consentimiento para que Growwly trate mis datos
              personales con el fin de gestionar esta solicitud.
            </label>
            <label className="flex items-start gap-2 rounded-lg border border-line bg-white p-3 text-sm">
              <input
                type="checkbox"
                checked={consentimientoCompartir}
                onChange={(e) =>
                  setConsentimientoCompartir(e.target.checked)
                }
                className="mt-0.5"
                required
              />
              Autorizo a compartir esta solicitud con las clínicas
              suscritas a Growwly, únicamente para que puedan enviarme una
              valoración u oferta comercial.
            </label>
          </div>

          {errorEnvio && (
            <p className="mt-4 rounded-lg bg-error/10 px-4 py-3 text-sm text-error-dark">
              {errorEnvio}
            </p>
          )}
        </section>
      )}

      <div className="mt-8 flex justify-between">
        <button
          type="button"
          onClick={anterior}
          disabled={paso === 1}
          className="rounded-lg px-4 py-2 text-sm font-medium text-ink-soft hover:text-teal disabled:opacity-0"
        >
          ← Atrás
        </button>

        {paso < TOTAL_PASOS ? (
          <button
            type="button"
            onClick={siguiente}
            className="rounded-lg bg-teal px-5 py-2.5 text-sm font-medium text-paper hover:bg-teal-dark"
          >
            Siguiente →
          </button>
        ) : (
          <button
            type="button"
            onClick={enviar}
            disabled={
              enviando || !consentimientoDatos || !consentimientoCompartir
            }
            className="rounded-lg bg-cyan px-5 py-2.5 text-sm font-medium text-white hover:bg-cyan-dark disabled:opacity-50"
          >
            {enviando ? "Enviando…" : "Enviar solicitud"}
          </button>
        )}
      </div>
    </div>
  );
}
