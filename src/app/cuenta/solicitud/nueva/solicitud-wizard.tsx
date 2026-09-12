"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { crearSolicitud } from "../actions";
import { TECNICAS_POR_CATEGORIA } from "@/lib/clinic-options";
import {
  PRESUPUESTO_PACIENTE_OPCIONES,
  labelPresupuesto,
  NORWOOD_OPCIONES,
  LUDWIG_OPCIONES,
} from "@/lib/solicitud-labels";
import type { Profile, EstudioCapilar } from "@/lib/supabase/database.types";

type Props = {
  profile: Profile | null;
  estudios: Pick<
    EstudioCapilar,
    "id" | "created_at" | "norwood_estimado" | "estado"
  >[];
  ciudadesConClinicas: string[];
};

const TOTAL_PASOS = 6;

const inputClass =
  "mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-teal/30";
const labelClass = "text-sm font-medium text-ink";

const CONDICIONES_MEDICAS_INFO = [
  { valor: "diabetes", nombre: "Diabetes" },
  { valor: "hipertension", nombre: "Hipertensión" },
  { valor: "problemas_cardiacos", nombre: "Problemas cardíacos" },
  { valor: "trastornos_coagulacion", nombre: "Trastornos de coagulación" },
  { valor: "enfermedades_autoinmunes", nombre: "Enfermedades autoinmunes" },
  { valor: "problemas_tiroideos", nombre: "Problemas tiroideos" },
  { valor: "depresion_ansiedad", nombre: "Depresión/Ansiedad" },
] as const;

export function SolicitudWizard({
  profile,
  estudios,
  ciudadesConClinicas,
}: Props) {
  const router = useRouter();
  const [paso, setPaso] = useState(1);
  const [enviando, setEnviando] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState<string | null>(null);

  const estudiosListos = estudios.filter((e) => e.estado === "listo");
  const [estudioId, setEstudioId] = useState<string | null>(
    estudiosListos[0]?.id ?? null,
  );

  // Paso 1: Perfil Personal
  const [sexo, setSexo] = useState(profile?.sexo ?? "");
  const [tipoPerdidaCabello, setTipoPerdidaCabello] = useState(
    profile?.tipo_perdida_cabello ?? "",
  );
  const [ciudad, setCiudad] = useState(profile?.ciudad ?? "");

  // Paso 2: Historial capilar
  const [progresionPerdida, setProgresionPerdida] = useState("");
  const [antecedentesFamiliares, setAntecedentesFamiliares] = useState("");
  const [medicacionActual, setMedicacionActual] = useState("");

  // Paso 3: Tratamientos de interés
  const [tratamientosInteres, setTratamientosInteres] = useState<string[]>(
    [],
  );
  const [dejarDecidirMedico, setDejarDecidirMedico] = useState(false);

  // Paso 4: Preferencias
  const [cuandoTratamiento, setCuandoTratamiento] = useState("");
  const [dondeTratamiento, setDondeTratamiento] = useState("");
  const [presupuestoRango, setPresupuestoRango] = useState("");
  const [prioridadDecision, setPrioridadDecision] = useState("");

  // Paso 5: Salud general
  const [alergias, setAlergias] = useState("");
  const [condicionesMedicas, setCondicionesMedicas] = useState<string[]>([]);
  const [cirugiasPrevias, setCirugiasPrevias] = useState("");
  const [fumador, setFumador] = useState("");

  // Paso 6: Consentimientos
  const [consentimientoDatos, setConsentimientoDatos] = useState(false);
  const [consentimientoInfoMedica, setConsentimientoInfoMedica] =
    useState(false);
  const [consentimientoFotos, setConsentimientoFotos] = useState(false);
  const [consentimientoCompartir, setConsentimientoCompartir] =
    useState(false);
  const [consentimientoTerminos, setConsentimientoTerminos] = useState(false);

  const todosLosConsentimientos =
    consentimientoDatos &&
    consentimientoInfoMedica &&
    consentimientoFotos &&
    consentimientoCompartir &&
    consentimientoTerminos;

  function marcarTodosLosConsentimientos(valor: boolean) {
    setConsentimientoDatos(valor);
    setConsentimientoInfoMedica(valor);
    setConsentimientoFotos(valor);
    setConsentimientoCompartir(valor);
    setConsentimientoTerminos(valor);
  }

  function toggleTratamiento(nombre: string) {
    setTratamientosInteres((prev) =>
      prev.includes(nombre)
        ? prev.filter((t) => t !== nombre)
        : [...prev, nombre],
    );
  }

  function toggleCondicionMedica(valor: string) {
    if (valor === "ninguna") {
      setCondicionesMedicas((prev) =>
        prev.includes("ninguna") ? [] : ["ninguna"],
      );
      return;
    }
    setCondicionesMedicas((prev) => {
      const sinNinguna = prev.filter((c) => c !== "ninguna");
      return sinNinguna.includes(valor)
        ? sinNinguna.filter((c) => c !== valor)
        : [...sinNinguna, valor];
    });
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
      sexo,
      tipoPerdidaCabello,
      ciudad,
      progresionPerdida,
      antecedentesFamiliares,
      medicacionActual,
      tratamientosInteres,
      dejarDecidirMedico,
      cuandoTratamiento,
      dondeTratamiento,
      presupuestoRango,
      prioridadDecision,
      alergias,
      condicionesMedicas,
      cirugiasPrevias,
      fumador,
      consentimientoDatos,
      consentimientoInfoMedica,
      consentimientoFotos,
      consentimientoCompartir,
      consentimientoTerminos,
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
            Perfil personal
          </h2>
          <p className="mt-1 text-sm text-ink-soft">
            Necesitamos estos datos para crear tu ficha médica.
          </p>

          <div className="mt-4 flex flex-col gap-4">
            <div>
              <label className={labelClass}>Soy</label>
              <div className="mt-1 grid grid-cols-2 gap-2">
                {(["hombre", "mujer"] as const).map((opcion) => (
                  <button
                    key={opcion}
                    type="button"
                    onClick={() => {
                      setSexo(opcion);
                      // Las escalas de hombre y mujer usan valores
                      // distintos (norwood_* vs ludwig_*): si cambia el
                      // sexo, el valor anterior ya no encaja.
                      setTipoPerdidaCabello("");
                    }}
                    className={`rounded-lg border px-3 py-2 text-sm font-medium capitalize ${
                      sexo === opcion
                        ? "border-teal bg-teal/10 text-teal-dark"
                        : "border-line bg-white text-ink hover:border-teal/40"
                    }`}
                  >
                    {opcion === "hombre" ? "Hombre" : "Mujer"}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className={labelClass}>
                Tipo de pérdida de cabello
              </label>
              {!sexo && (
                <p className="mt-1 rounded-lg border border-dashed border-line bg-white px-3 py-2 text-sm text-ink-soft">
                  Selecciona antes si eres hombre o mujer para ver las
                  opciones.
                </p>
              )}
              {sexo && (
                <select
                  value={tipoPerdidaCabello}
                  onChange={(e) => setTipoPerdidaCabello(e.target.value)}
                  className={inputClass}
                >
                  <option value="">Selecciona una opción</option>
                  {(sexo === "mujer" ? LUDWIG_OPCIONES : NORWOOD_OPCIONES).map(
                    (o) => (
                      <option key={o.valor} value={o.valor}>
                        {o.nombre} — {o.descripcion}
                      </option>
                    ),
                  )}
                </select>
              )}
            </div>

            <div>
              <label className={labelClass}>Ubicación</label>
              {ciudadesConClinicas.length > 0 ? (
                <select
                  value={ciudad}
                  onChange={(e) => setCiudad(e.target.value)}
                  className={inputClass}
                >
                  <option value="">Selecciona una ciudad</option>
                  {ciudadesConClinicas.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={ciudad}
                  onChange={(e) => setCiudad(e.target.value)}
                  placeholder="¿En qué ciudad estás?"
                  className={inputClass}
                />
              )}
              <p className="mt-1 text-xs text-ink-soft">
                Necesitaremos esto para ubicar tu clínica.
              </p>
            </div>
          </div>

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
          <p className="mt-2 text-xs text-ink-soft">
            Los usaremos para que las clínicas puedan responderte. Los
            puedes actualizar desde{" "}
            <a href="/cuenta" className="text-cyan hover:text-cyan-dark">
              Mi cuenta
            </a>{" "}
            si algo no es correcto.
          </p>

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
          {estudiosListos.length === 0 && (
            <div className="mt-4 rounded-lg border border-dashed border-line bg-white p-4 text-sm">
              <p className="text-ink-soft">
                Todavía no tienes fotos subidas. Puedes continuar sin
                ellas, pero ayudan mucho a que las clínicas valoren tu
                caso.
              </p>
              <a
                href="/analisis/nuevo"
                className="mt-2 inline-block text-sm font-medium text-cyan hover:text-cyan-dark"
              >
                Subir fotos ahora →
              </a>
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
                <option value="lenta">Lenta (años)</option>
                <option value="moderada">Moderada (meses)</option>
                <option value="rapida">Rápida (semanas)</option>
                <option value="estable">Estable</option>
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
                placeholder="Ej. mi abuelo era calvo, mi padre tiene el pelo fino y canoso"
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

          <label className="mt-3 flex items-center gap-2 rounded-lg bg-sage px-3 py-2.5 text-sm font-medium text-sage-ink">
            <input
              type="checkbox"
              checked={dejarDecidirMedico}
              onChange={(e) => setDejarDecidirMedico(e.target.checked)}
            />
            Me dejo asesorar — que el médico decida la mejor opción para
            mi caso
          </label>

          {!dejarDecidirMedico && (
            <>
              <p className="mt-4 text-sm text-ink-soft">
                O elige tú directamente los que te interesan:
              </p>
              <div className="mt-2 flex flex-col gap-4">
                {Object.entries(TECNICAS_POR_CATEGORIA).map(
                  ([categoria, tecnicas]) => (
                    <div key={categoria}>
                      <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
                        {categoria}
                      </p>
                      <div className="mt-2 flex flex-col gap-2">
                        {tecnicas.map((t) => (
                          <label
                            key={t}
                            className="flex items-start gap-2 rounded-lg border border-line bg-white p-3 text-sm hover:border-teal/40"
                          >
                            <input
                              type="checkbox"
                              checked={tratamientosInteres.includes(t)}
                              onChange={() => toggleTratamiento(t)}
                              className="mt-0.5"
                            />
                            <span className="font-medium text-ink">
                              {t}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ),
                )}
              </div>
            </>
          )}
        </section>
      )}

      {paso === 4 && (
        <section>
          <h2 className="font-display text-lg text-teal-dark">
            Preferencias
          </h2>
          <p className="mt-1 text-sm text-ink-soft">
            Presupuesto, ubicación y cuándo.
          </p>
          <div className="mt-4 flex flex-col gap-4">
            <div>
              <label className={labelClass}>Rango de presupuesto</label>
              <select
                value={presupuestoRango}
                onChange={(e) => setPresupuestoRango(e.target.value)}
                className={inputClass}
              >
                <option value="">Selecciona una opción</option>
                {PRESUPUESTO_PACIENTE_OPCIONES.map((valor) => (
                  <option key={valor} value={valor}>
                    Hasta {labelPresupuesto(valor)}
                  </option>
                ))}
                <option value="flexible">Flexible</option>
              </select>
            </div>

            <div>
              <label className={labelClass}>
                A la hora de decidir, ¿qué es lo MÁS importante para ti?
              </label>
              <select
                value={prioridadDecision}
                onChange={(e) => setPrioridadDecision(e.target.value)}
                className={inputClass}
              >
                <option value="">Selecciona una opción</option>
                <option value="reputacion_cirujano">
                  La reputación y experiencia del cirujano
                </option>
                <option value="resenas_fotos">
                  Las reseñas y fotos de otros pacientes
                </option>
                <option value="tecnologia">
                  La tecnología que utiliza la clínica
                </option>
                <option value="precio">El precio final</option>
              </select>
            </div>

            <div>
              <label className={labelClass}>
                Ubicación preferida para la cirugía
              </label>
              <select
                value={dondeTratamiento}
                onChange={(e) => setDondeTratamiento(e.target.value)}
                className={inputClass}
              >
                <option value="">Selecciona una opción</option>
                <option value="ciudad">En mi ciudad o cerca de mí</option>
                <option value="provincia">
                  En mi provincia — Solo en mi provincia
                </option>
                <option value="comunidad">
                  En mi Comunidad Autónoma — Estoy abierto/a a moverme por
                  mi Comunidad Autónoma
                </option>
                <option value="sin_preferencia">
                  Sin preferencia — Me desplazaría a cualquier parte de
                  España por la clínica adecuada
                </option>
              </select>
            </div>

            <div>
              <label className={labelClass}>
                Tiempo disponible para la cirugía
              </label>
              <select
                value={cuandoTratamiento}
                onChange={(e) => setCuandoTratamiento(e.target.value)}
                className={inputClass}
              >
                <option value="">Selecciona una opción</option>
                <option value="lo_antes_posible">Lo antes posible</option>
                <option value="1_3_meses">
                  1 a 3 meses — Es urgente, ya estoy convencido/a
                </option>
                <option value="3_6_meses">
                  3 a 6 meses — Estoy convencido/a, sin prisa
                </option>
                <option value="6_12_meses">
                  6 a 12 meses — No estoy convencido/a
                </option>
                <option value="flexible">
                  Flexible — Solo estoy explorando opciones
                </option>
              </select>
            </div>
          </div>
        </section>
      )}

      {paso === 5 && (
        <section>
          <h2 className="font-display text-lg text-teal-dark">
            Salud general
          </h2>
          <p className="mt-1 text-sm text-ink-soft">
            Esta información ayuda a la clínica a valorar tu caso con
            seguridad.
          </p>
          <div className="mt-4 flex flex-col gap-4">
            <div>
              <label className={labelClass}>Alergias conocidas</label>
              <textarea
                value={alergias}
                onChange={(e) => setAlergias(e.target.value)}
                rows={2}
                placeholder="Lista cualquier alergia a medicamentos, anestesia, etc."
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>
                Condiciones médicas (selecciona todas las que apliquen)
              </label>
              <div className="mt-2 flex flex-col gap-2">
                {CONDICIONES_MEDICAS_INFO.map((c) => (
                  <label
                    key={c.valor}
                    className="flex items-center gap-2 rounded-lg border border-line bg-white p-2.5 text-sm hover:border-teal/40"
                  >
                    <input
                      type="checkbox"
                      checked={condicionesMedicas.includes(c.valor)}
                      onChange={() => toggleCondicionMedica(c.valor)}
                    />
                    {c.nombre}
                  </label>
                ))}
                <label className="flex items-center gap-2 rounded-lg border border-line bg-white p-2.5 text-sm font-medium hover:border-teal/40">
                  <input
                    type="checkbox"
                    checked={condicionesMedicas.includes("ninguna")}
                    onChange={() => toggleCondicionMedica("ninguna")}
                  />
                  Ninguna
                </label>
              </div>
            </div>

            <div>
              <label className={labelClass}>Cirugías previas</label>
              <textarea
                value={cirugiasPrevias}
                onChange={(e) => setCirugiasPrevias(e.target.value)}
                rows={2}
                placeholder="Describe cualquier cirugía previa relevante"
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>¿Fumas actualmente?</label>
              <select
                value={fumador}
                onChange={(e) => setFumador(e.target.value)}
                className={inputClass}
              >
                <option value="">Selecciona una opción</option>
                <option value="no_fumo">No fumo</option>
                <option value="ocasional">Ocasionalmente</option>
                <option value="regular">Regularmente</option>
              </select>
            </div>
          </div>
        </section>
      )}

      {paso === 6 && (
        <section>
          <h2 className="font-display text-lg text-teal-dark">
            Términos y condiciones
          </h2>
          <p className="mt-1 text-sm text-ink-soft">
            Por favor, lee y acepta los siguientes términos para
            continuar.
          </p>

          <label className="mt-3 flex items-center gap-2 rounded-lg bg-sage px-3 py-2.5 text-sm font-medium text-sage-ink">
            <input
              type="checkbox"
              checked={todosLosConsentimientos}
              onChange={(e) =>
                marcarTodosLosConsentimientos(e.target.checked)
              }
            />
            Aceptar todo
          </label>

          <div className="mt-3 flex flex-col gap-3">
            <label className="flex items-start gap-2 rounded-lg border border-line bg-white p-3 text-sm">
              <input
                type="checkbox"
                checked={consentimientoDatos}
                onChange={(e) => setConsentimientoDatos(e.target.checked)}
                className="mt-0.5"
                required
              />
              <span>
                <span className="font-medium">
                  Política de privacidad
                </span>{" "}
                — Acepto el tratamiento de mis datos personales según la
                política de privacidad.
              </span>
            </label>
            <label className="flex items-start gap-2 rounded-lg border border-line bg-white p-3 text-sm">
              <input
                type="checkbox"
                checked={consentimientoInfoMedica}
                onChange={(e) =>
                  setConsentimientoInfoMedica(e.target.checked)
                }
                className="mt-0.5"
                required
              />
              <span>
                <span className="font-medium">Información médica</span> —
                Confirmo que la información médica proporcionada es
                veraz y completa.
              </span>
            </label>
            <label className="flex items-start gap-2 rounded-lg border border-line bg-white p-3 text-sm">
              <input
                type="checkbox"
                checked={consentimientoFotos}
                onChange={(e) => setConsentimientoFotos(e.target.checked)}
                className="mt-0.5"
                required
              />
              <span>
                <span className="font-medium">Uso de fotografías</span> —
                Autorizo el uso de mis fotografías únicamente para
                evaluación médica.
              </span>
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
              <span>
                <span className="font-medium">Comunicaciones</span> —
                Acepto recibir comunicaciones de clínicas
                especializadas.
              </span>
            </label>
            <label className="flex items-start gap-2 rounded-lg border border-line bg-white p-3 text-sm">
              <input
                type="checkbox"
                checked={consentimientoTerminos}
                onChange={(e) =>
                  setConsentimientoTerminos(e.target.checked)
                }
                className="mt-0.5"
                required
              />
              <span>
                <span className="font-medium">Términos de servicio</span>{" "}
                — He leído y acepto los términos y condiciones del
                servicio.
              </span>
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
            disabled={enviando || !todosLosConsentimientos}
            className="rounded-lg bg-cyan px-5 py-2.5 text-sm font-medium text-white hover:bg-cyan-dark disabled:opacity-50"
          >
            {enviando ? "Enviando…" : "Enviar solicitud"}
          </button>
        )}
      </div>
    </div>
  );
}
