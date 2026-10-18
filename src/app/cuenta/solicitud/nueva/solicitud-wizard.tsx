"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  Check,
  HeartPulse,
  History,
  LoaderCircle,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { crearSolicitud } from "../actions";
import { trackEvent } from "@/lib/analytics/events";
import { leerAtribucion } from "@/lib/analytics/atribucion";
import { TECNICAS_POR_CATEGORIA } from "@/lib/clinic-options";
import {
  PRESUPUESTO_PACIENTE_OPCIONES,
  labelPresupuesto,
  PRIORIDAD_OPCIONES,
  SINTOMAS_CUERO_CABELLUDO_OPCIONES,
  TRATAMIENTOS_USADOS_OPCIONES,
} from "@/lib/solicitud-labels";
import type { Profile, EstudioCapilar } from "@/lib/supabase/database.types";

type Props = {
  profile: Profile | null;
  estudios: Pick<
    EstudioCapilar,
    "id" | "created_at" | "norwood_estimado" | "estado"
  >[];
  /** Estudio que llega preseleccionado desde el botón del informe. */
  estudioInicialId?: string | null;
};

const PASOS: { corto: string; titulo: string; subtitulo: string; icono: LucideIcon }[] = [
  {
    corto: "Tú",
    titulo: "Perfil personal",
    subtitulo: "Revisa tus datos: son los que verá la clínica para responderte.",
    icono: UserRound,
  },
  {
    corto: "Historial",
    titulo: "Historial capilar",
    subtitulo: "Cómo ha ido tu pérdida de cabello y qué has probado.",
    icono: History,
  },
  {
    corto: "Tratamientos",
    titulo: "Tratamientos que te interesan",
    subtitulo: "Elige los que quieres valorar, o deja que decida el médico.",
    icono: Sparkles,
  },
  {
    corto: "Preferencias",
    titulo: "Preferencias",
    subtitulo: "Presupuesto, ubicación y cuándo.",
    icono: SlidersHorizontal,
  },
  {
    corto: "Salud",
    titulo: "Salud general",
    subtitulo: "Ayuda a la clínica a valorar tu caso con seguridad.",
    icono: HeartPulse,
  },
  {
    corto: "Confirmar",
    titulo: "Términos y condiciones",
    subtitulo: "Lee y acepta los siguientes términos para enviar tu solicitud.",
    icono: ShieldCheck,
  },
];

const TOTAL_PASOS = PASOS.length;

const PRESUPUESTO_MIN = Number(PRESUPUESTO_PACIENTE_OPCIONES[0]);
const PRESUPUESTO_MAX = Number(
  PRESUPUESTO_PACIENTE_OPCIONES[PRESUPUESTO_PACIENTE_OPCIONES.length - 1],
);
const PRESUPUESTO_PASO = 500;
const PRESUPUESTO_INICIAL = 3000;

const PROGRESION_OPCIONES = [
  { valor: "lenta", nombre: "Lenta", detalle: "Poco a poco, a lo largo de años" },
  { valor: "moderada", nombre: "Moderada", detalle: "Se nota de un mes a otro" },
  { valor: "rapida", nombre: "Rápida", detalle: "Cambios en cuestión de semanas" },
  { valor: "estable", nombre: "Estable", detalle: "Hace tiempo que no va a más" },
];

const DONDE_OPCIONES = [
  { valor: "ciudad", nombre: "En mi ciudad o cerca de mí", detalle: null },
  { valor: "provincia", nombre: "En mi provincia", detalle: "Solo en mi provincia" },
  {
    valor: "comunidad",
    nombre: "En mi Comunidad Autónoma",
    detalle: "Estoy abierto/a a moverme por mi Comunidad Autónoma",
  },
  {
    valor: "sin_preferencia",
    nombre: "Sin preferencia",
    detalle: "Me desplazaría a cualquier parte de España por la clínica adecuada",
  },
];

const CUANDO_OPCIONES = [
  { valor: "lo_antes_posible", nombre: "Lo antes posible", detalle: null },
  { valor: "1_3_meses", nombre: "1 a 3 meses", detalle: "Es urgente, ya estoy convencido/a" },
  { valor: "3_6_meses", nombre: "3 a 6 meses", detalle: "Estoy convencido/a, sin prisa" },
  { valor: "6_12_meses", nombre: "6 a 12 meses", detalle: "No estoy convencido/a" },
  { valor: "flexible", nombre: "Flexible", detalle: "Solo estoy explorando opciones" },
];

const FUMADOR_OPCIONES = [
  { valor: "no_fumo", nombre: "No fumo" },
  { valor: "ocasional", nombre: "Ocasionalmente" },
  { valor: "regular", nombre: "Regularmente" },
];

const CONDICIONES_MEDICAS_INFO = [
  { valor: "diabetes", nombre: "Diabetes" },
  { valor: "hipertension", nombre: "Hipertensión" },
  { valor: "problemas_cardiacos", nombre: "Problemas cardíacos" },
  { valor: "trastornos_coagulacion", nombre: "Trastornos de coagulación" },
  { valor: "enfermedades_autoinmunes", nombre: "Enfermedades autoinmunes" },
  { valor: "problemas_tiroideos", nombre: "Problemas tiroideos" },
  { valor: "depresion_ansiedad", nombre: "Depresión/Ansiedad" },
] as const;

const inputClass =
  "mt-2 w-full rounded-xl border border-line bg-white px-4 py-3 text-[15px] text-ink placeholder:text-ink-soft/70 transition-colors focus:border-teal focus:outline-none focus:ring-4 focus:ring-teal/10";

/* ───────────── Piezas de UI del asistente ───────────── */

function Pregunta({
  titulo,
  ayuda,
  children,
}: {
  titulo: string;
  ayuda?: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="min-w-0">
      <legend className="text-[15px] font-semibold text-ink">{titulo}</legend>
      {ayuda && <p className="mt-0.5 text-sm text-ink-soft">{ayuda}</p>}
      {children}
    </fieldset>
  );
}

function MarcaCheck({ activo, redondo }: { activo: boolean; redondo?: boolean }) {
  return (
    <span
      aria-hidden
      className={`flex h-5 w-5 shrink-0 items-center justify-center border-2 transition-colors ${
        redondo ? "rounded-full" : "rounded-md"
      } ${activo ? "border-teal bg-teal text-white" : "border-line bg-white"}`}
    >
      {activo && <Check className="h-3 w-3" strokeWidth={3.5} />}
    </span>
  );
}

/** Tarjeta de opción única (se comporta como un radio). */
function OpcionTarjeta({
  activo,
  onClick,
  titulo,
  detalle,
}: {
  activo: boolean;
  onClick: () => void;
  titulo: string;
  detalle?: string | null;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={activo}
      onClick={onClick}
      className={`press flex w-full items-start gap-3 rounded-2xl border-2 px-4 py-3.5 text-left transition-colors ${
        activo
          ? "border-teal bg-teal/[0.06]"
          : "border-line bg-white hover:border-teal/40"
      }`}
    >
      <span className="mt-0.5">
        <MarcaCheck activo={activo} redondo />
      </span>
      <span className="min-w-0">
        <span className={`block text-[15px] font-medium ${activo ? "text-teal-dark" : "text-ink"}`}>
          {titulo}
        </span>
        {detalle && <span className="mt-0.5 block text-sm text-ink-soft">{detalle}</span>}
      </span>
    </button>
  );
}

/** Píldora de selección múltiple. */
function Chip({
  activo,
  onClick,
  children,
}: {
  activo: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={activo}
      onClick={onClick}
      className={`press inline-flex items-center gap-1.5 rounded-full border-2 px-4 py-2 text-sm font-medium transition-colors ${
        activo
          ? "border-teal bg-teal text-white"
          : "border-line bg-white text-ink hover:border-teal/40"
      }`}
    >
      {activo && <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden />}
      {children}
    </button>
  );
}

/** Casilla de consentimiento (checkbox nativo, estilo tarjeta). */
function Consentimiento({
  checked,
  onChange,
  href,
  enlace,
  texto,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  href: string;
  enlace: string;
  texto: string;
}) {
  return (
    <label
      className={`flex cursor-pointer items-start gap-3 rounded-2xl border-2 p-4 text-sm leading-relaxed transition-colors ${
        checked ? "border-teal/50 bg-teal/[0.04]" : "border-line bg-white hover:border-teal/30"
      }`}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-5 w-5 shrink-0 accent-teal"
        required
      />
      <span className="text-ink">
        <Link
          href={href}
          target="_blank"
          className="font-semibold text-cyan-dark underline-offset-2 hover:underline"
        >
          {enlace}
        </Link>{" "}
        — {texto}
      </span>
    </label>
  );
}

/* ───────────── Asistente ───────────── */

export function SolicitudWizard({
  profile,
  estudios,
  estudioInicialId,
}: Props) {
  const router = useRouter();
  const [paso, setPaso] = useState(1);
  const [enviando, setEnviando] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState<string | null>(null);
  const arribaRef = useRef<HTMLDivElement>(null);
  const primerRender = useRef(true);

  const estudiosListos = estudios.filter((e) => e.estado === "listo");
  // Se vincula el análisis que llega preseleccionado desde el botón del
  // informe (?estudio=...) o, si no hay ninguno, el más reciente — no
  // tiene sentido dejar elegir uno más antiguo a mano, y así el
  // paciente no tiene que saber qué es "vincular un análisis".
  const estudioSeleccionado =
    estudiosListos.find((e) => e.id === estudioInicialId) ??
    estudiosListos[0] ??
    null;
  const estudioId = estudioSeleccionado?.id ?? null;

  // Paso 1: Perfil Personal
  const [sexo, setSexo] = useState(profile?.sexo ?? "");
  // El tipo de pérdida de cabello ya no lo elige el paciente: se toma
  // directamente del análisis vinculado (o del valor ya guardado en su
  // perfil de una solicitud anterior, si no tiene ninguno listo
  // todavía).
  const tipoPerdidaCabello =
    estudioSeleccionado?.norwood_estimado ?? profile?.tipo_perdida_cabello ?? "";
  // La ciudad tampoco se vuelve a preguntar aquí — ya vive en el
  // perfil (se pide más adelante, en el paso 4, con más precisión).
  const ciudad = profile?.ciudad ?? "";
  const [aceptaMarketingEmail, setAceptaMarketingEmail] = useState(
    profile?.acepta_marketing_email ?? false,
  );

  // Paso 2: Historial capilar
  const [progresionPerdida, setProgresionPerdida] = useState("");
  const [antecedentesFamiliares, setAntecedentesFamiliares] = useState("");
  const [medicacionActual, setMedicacionActual] = useState("");
  const [sintomasCueroCabelludo, setSintomasCueroCabelludo] = useState<
    string[]
  >([]);
  const [tratamientosUsados, setTratamientosUsados] = useState<string[]>([]);
  const [tratamientosUsadosDetalle, setTratamientosUsadosDetalle] =
    useState("");
  const [cambiosSaludRecientes, setCambiosSaludRecientes] = useState("");

  // Paso 3: Tratamientos de interés
  const [tratamientosInteres, setTratamientosInteres] = useState<string[]>(
    [],
  );
  const [dejarDecidirMedico, setDejarDecidirMedico] = useState(false);

  // Paso 4: Preferencias
  const [codigoPostal, setCodigoPostal] = useState("");
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

  // Al cambiar de paso, vuelve arriba del asistente (en móvil el paso
  // anterior suele dejar el scroll a media pantalla).
  useEffect(() => {
    if (primerRender.current) {
      primerRender.current = false;
      return;
    }
    const el = arribaRef.current;
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - 88;
    if (window.scrollY > top) window.scrollTo({ top });
  }, [paso]);

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

  function toggleSintoma(valor: string) {
    setSintomasCueroCabelludo((prev) =>
      prev.includes(valor) ? prev.filter((s) => s !== valor) : [...prev, valor],
    );
  }

  function toggleTratamientoUsado(valor: string) {
    setTratamientosUsados((prev) =>
      prev.includes(valor) ? prev.filter((t) => t !== valor) : [...prev, valor],
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
    trackEvent("wizard_paso_completado", { wizard: "solicitud_presupuesto", paso });
    setPaso((p) => Math.min(p + 1, TOTAL_PASOS));
  }
  function anterior() {
    setPaso((p) => Math.max(p - 1, 1));
  }
  function irAPaso(n: number) {
    // Solo hacia atrás: los pasos siguientes se completan en orden.
    if (n < paso) setPaso(n);
  }

  async function enviar() {
    setEnviando(true);
    setErrorEnvio(null);
    const resultado = await crearSolicitud({
      atribucion: leerAtribucion(),
      estudioId,
      sexo,
      tipoPerdidaCabello,
      ciudad,
      progresionPerdida,
      antecedentesFamiliares,
      medicacionActual,
      sintomasCueroCabelludo,
      tratamientosUsados,
      tratamientosUsadosDetalle,
      cambiosSaludRecientes,
      tratamientosInteres,
      dejarDecidirMedico,
      codigoPostal,
      cuandoTratamiento,
      dondeTratamiento,
      presupuestoRango,
      prioridadDecision,
      alergias,
      condicionesMedicas,
      cirugiasPrevias,
      fumador,
      aceptaMarketingEmail,
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

    trackEvent("generate_lead", {
      tipo_lead: "solicitud_presupuesto",
      tratamientos_interes: tratamientosInteres.length,
      ciudad: ciudad || undefined,
    });
    router.push(`/cuenta/solicitud/${resultado.id}`);
  }

  const pasoActual = PASOS[paso - 1];
  const IconoPaso = pasoActual.icono;
  const presupuestoNumero =
    presupuestoRango && presupuestoRango !== "flexible"
      ? Number(presupuestoRango)
      : PRESUPUESTO_INICIAL;
  const porcentajePresupuesto =
    ((presupuestoNumero - PRESUPUESTO_MIN) / (PRESUPUESTO_MAX - PRESUPUESTO_MIN)) * 100;

  return (
    <div ref={arribaRef}>
      {/* ── Progreso ── */}
      <nav aria-label="Progreso de la solicitud" className="mb-5">
        {/* Móvil: barra segmentada + paso actual */}
        <div className="sm:hidden">
          <div className="flex items-baseline justify-between">
            <p className="text-sm font-semibold text-teal-dark">{pasoActual.corto}</p>
            <p className="text-xs font-medium text-ink-soft">
              Paso {paso} de {TOTAL_PASOS}
            </p>
          </div>
          <div className="mt-2 flex gap-1.5">
            {PASOS.map((p, i) => (
              <div key={p.corto} className="h-1.5 flex-1 overflow-hidden rounded-full bg-line">
                <div
                  className="h-full rounded-full bg-teal transition-[width] duration-300 ease-out"
                  style={{ width: i + 1 <= paso ? "100%" : "0%" }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Escritorio: pasos con nombre */}
        <ol className="hidden items-start sm:flex">
          {PASOS.map((p, i) => {
            const n = i + 1;
            const hecho = n < paso;
            const actual = n === paso;
            return (
              <li key={p.corto} className="relative flex flex-1 flex-col items-center">
                {i > 0 && (
                  <span
                    aria-hidden
                    className={`absolute right-1/2 top-4 h-0.5 w-full -translate-y-1/2 transition-colors duration-300 ${
                      n <= paso ? "bg-teal" : "bg-line"
                    }`}
                  />
                )}
                <button
                  type="button"
                  onClick={() => irAPaso(n)}
                  disabled={!hecho}
                  aria-current={actual ? "step" : undefined}
                  aria-label={`Paso ${n}: ${p.titulo}`}
                  className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-colors ${
                    hecho
                      ? "bg-teal text-white hover:bg-teal-dark"
                      : actual
                        ? "bg-white text-teal-dark ring-2 ring-teal"
                        : "bg-white text-ink-soft ring-1 ring-line"
                  }`}
                >
                  {hecho ? <Check className="h-4 w-4" strokeWidth={3} aria-hidden /> : n}
                </button>
                <span
                  className={`mt-2 text-xs font-medium ${
                    actual ? "text-teal-dark" : hecho ? "text-ink" : "text-ink-soft"
                  }`}
                >
                  {p.corto}
                </span>
              </li>
            );
          })}
        </ol>
      </nav>

      {/* ── Tarjeta del paso ── */}
      <div className="rounded-[28px] bg-white p-5 shadow-[0_4px_6px_rgba(0,0,0,0.05)] ring-1 ring-line sm:p-8">
        <header className="flex items-start gap-3.5">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-sage text-sage-ink">
            <IconoPaso className="h-5 w-5" strokeWidth={2} aria-hidden />
          </span>
          <div>
            <h2 className="font-display text-xl text-teal-dark">{pasoActual.titulo}</h2>
            <p className="mt-0.5 text-sm text-ink-soft">{pasoActual.subtitulo}</p>
          </div>
        </header>

        <div key={paso} className="paso-anim mt-6">
          {paso === 1 && (
            <section className="flex flex-col gap-6">
              <Pregunta titulo="Soy">
                <div role="radiogroup" className="mt-2 grid grid-cols-2 gap-2">
                  {(["hombre", "mujer"] as const).map((opcion) => (
                    <OpcionTarjeta
                      key={opcion}
                      activo={sexo === opcion}
                      onClick={() => setSexo(opcion)}
                      titulo={opcion === "hombre" ? "Hombre" : "Mujer"}
                    />
                  ))}
                </div>
              </Pregunta>

              <div>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-2xl bg-paper-dim/70 p-4 text-sm">
                  {[
                    ["Nombre", `${profile?.nombre || "—"} ${profile?.apellidos ?? ""}`],
                    ["Edad", profile?.edad ? String(profile.edad) : "—"],
                    ["Teléfono", profile?.telefono || "—"],
                    ["Email", profile?.email ?? "—"],
                    ["Ciudad", ciudad || "—"],
                    ["Tipo de pérdida", tipoPerdidaCabello || "Se calcula con tu análisis"],
                  ].map(([dt, dd]) => (
                    <div key={dt} className="min-w-0">
                      <dt className="text-xs text-ink-soft">{dt}</dt>
                      <dd className="truncate font-medium text-ink">{dd}</dd>
                    </div>
                  ))}
                </dl>
                <p className="mt-2 text-xs text-ink-soft">
                  Los usaremos para que las clínicas puedan responderte. Los
                  puedes actualizar desde{" "}
                  <Link href="/cuenta" className="font-medium text-cyan-dark hover:underline">
                    Mi cuenta
                  </Link>{" "}
                  si algo no es correcto.
                </p>
              </div>

              {estudioSeleccionado ? (
                <div className="flex items-center gap-3 rounded-2xl border border-teal/20 bg-teal/[0.04] p-4 text-sm">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal text-white">
                    <Check className="h-4 w-4" strokeWidth={3} aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <p className="text-ink-soft">
                      {estudioSeleccionado.id === estudioInicialId
                        ? "Vinculamos la valoración que elegiste:"
                        : "Vinculamos automáticamente tu valoración más reciente:"}
                    </p>
                    <p className="font-medium text-ink">
                      Valoración del{" "}
                      {new Date(estudioSeleccionado.created_at).toLocaleDateString("es-ES")}
                      {estudioSeleccionado.norwood_estimado
                        ? ` · ${estudioSeleccionado.norwood_estimado}`
                        : ""}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3 rounded-2xl border-2 border-dashed border-line p-4 text-sm">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-paper-dim text-teal">
                    <Camera className="h-4 w-4" aria-hidden />
                  </span>
                  <div>
                    <p className="text-ink-soft">
                      Todavía no tienes fotos subidas. Puedes continuar sin
                      ellas, pero ayudan mucho a que las clínicas valoren tu
                      caso.
                    </p>
                    <Link
                      href="/analisis/nuevo"
                      className="mt-1 inline-block font-medium text-cyan-dark hover:underline"
                    >
                      Subir fotos ahora →
                    </Link>
                  </div>
                </div>
              )}

              <label className="flex cursor-pointer items-start gap-3 text-sm leading-relaxed text-ink-soft">
                <input
                  type="checkbox"
                  checked={aceptaMarketingEmail}
                  onChange={(e) => setAceptaMarketingEmail(e.target.checked)}
                  className="mt-0.5 h-5 w-5 shrink-0 accent-teal"
                />
                <span>
                  <span className="font-medium text-ink">
                    Quiero recibir novedades de Growwly por email
                  </span>{" "}
                  — consejos sobre salud capilar, nuevas clínicas y ofertas.
                  Es opcional y puedes darte de baja cuando quieras desde{" "}
                  <Link href="/cuenta" className="text-cyan-dark hover:underline">
                    Mi cuenta
                  </Link>{" "}
                  o desde el propio email. Más información en nuestra{" "}
                  <Link
                    href="/legal/terminos#comunicaciones-marketing"
                    className="text-cyan-dark hover:underline"
                  >
                    política de comunicaciones
                  </Link>
                  .
                </span>
              </label>
            </section>
          )}

          {paso === 2 && (
            <section className="flex flex-col gap-7">
              <Pregunta titulo="¿Cómo describirías la progresión de tu pérdida de cabello?">
                <div role="radiogroup" className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {PROGRESION_OPCIONES.map((o) => (
                    <OpcionTarjeta
                      key={o.valor}
                      activo={progresionPerdida === o.valor}
                      onClick={() => setProgresionPerdida(o.valor)}
                      titulo={o.nombre}
                      detalle={o.detalle}
                    />
                  ))}
                </div>
              </Pregunta>

              <Pregunta titulo="¿Notas algo en el cuero cabelludo?" ayuda="Marca todo lo que aplique.">
                <div className="mt-3 flex flex-wrap gap-2">
                  {SINTOMAS_CUERO_CABELLUDO_OPCIONES.map((s) => (
                    <Chip
                      key={s.valor}
                      activo={sintomasCueroCabelludo.includes(s.valor)}
                      onClick={() => toggleSintoma(s.valor)}
                    >
                      {s.nombre}
                    </Chip>
                  ))}
                </div>
              </Pregunta>

              <Pregunta titulo="Qué tratamientos has usado antes">
                <div className="mt-3 flex flex-wrap gap-2">
                  {TRATAMIENTOS_USADOS_OPCIONES.map((t) => (
                    <Chip
                      key={t.valor}
                      activo={tratamientosUsados.includes(t.valor)}
                      onClick={() => toggleTratamientoUsado(t.valor)}
                    >
                      {t.nombre}
                    </Chip>
                  ))}
                </div>
                {tratamientosUsados.length > 0 && (
                  <textarea
                    value={tratamientosUsadosDetalle}
                    onChange={(e) => setTratamientosUsadosDetalle(e.target.value)}
                    rows={2}
                    aria-label="Detalle de los tratamientos usados"
                    placeholder="Dosis, desde cuándo, y si notaste algún efecto secundario"
                    className={`${inputClass} mt-3`}
                  />
                )}
              </Pregunta>

              <label className="block">
                <span className="text-[15px] font-semibold text-ink">
                  Antecedentes familiares con alopecia
                </span>
                <textarea
                  value={antecedentesFamiliares}
                  onChange={(e) => setAntecedentesFamiliares(e.target.value)}
                  rows={2}
                  placeholder="Ej. mi abuelo era calvo, mi padre tiene el pelo fino y canoso"
                  className={inputClass}
                />
              </label>

              <label className="block">
                <span className="text-[15px] font-semibold text-ink">
                  Medicación actual para el cabello
                </span>
                <textarea
                  value={medicacionActual}
                  onChange={(e) => setMedicacionActual(e.target.value)}
                  rows={2}
                  placeholder="Ej. minoxidil desde hace 1 año, o ninguna"
                  className={inputClass}
                />
              </label>

              <label className="block">
                <span className="text-[15px] font-semibold text-ink">
                  Cambios de salud recientes
                </span>
                <textarea
                  value={cambiosSaludRecientes}
                  onChange={(e) => setCambiosSaludRecientes(e.target.value)}
                  rows={2}
                  placeholder="Enfermedades, periodos de mucho estrés, pérdida de peso, cambios de dieta o de medicación — o ninguno"
                  className={inputClass}
                />
              </label>
            </section>
          )}

          {paso === 3 && (
            <section className="flex flex-col gap-6">
              <button
                type="button"
                role="switch"
                aria-checked={dejarDecidirMedico}
                onClick={() => setDejarDecidirMedico((v) => !v)}
                className={`press flex w-full items-center gap-4 rounded-2xl border-2 p-5 text-left transition-colors ${
                  dejarDecidirMedico
                    ? "border-sage-ink/40 bg-sage"
                    : "border-sage bg-sage/40 hover:bg-sage/60"
                }`}
              >
                <MarcaCheck activo={dejarDecidirMedico} />
                <span>
                  <span className="block text-base font-semibold text-sage-ink">
                    Me dejo asesorar
                  </span>
                  <span className="block text-sm text-sage-ink/80">
                    Que el médico decida la mejor opción para mi caso
                  </span>
                </span>
              </button>

              {!dejarDecidirMedico && (
                <div className="flex flex-col gap-5">
                  <div className="flex items-center gap-3 text-xs font-medium uppercase tracking-wide text-ink-soft">
                    <span className="h-px flex-1 bg-line" />o elige tú directamente
                    <span className="h-px flex-1 bg-line" />
                  </div>
                  {Object.entries(TECNICAS_POR_CATEGORIA).map(([categoria, tecnicas]) => (
                    <div key={categoria}>
                      <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
                        {categoria}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {tecnicas.map((t) => (
                          <Chip
                            key={t}
                            activo={tratamientosInteres.includes(t)}
                            onClick={() => toggleTratamiento(t)}
                          >
                            {t}
                          </Chip>
                        ))}
                      </div>
                    </div>
                  ))}
                  {tratamientosInteres.length > 0 && (
                    <p className="text-sm font-medium text-teal-dark">
                      {tratamientosInteres.length === 1
                        ? "1 tratamiento seleccionado"
                        : `${tratamientosInteres.length} tratamientos seleccionados`}
                    </p>
                  )}
                </div>
              )}
            </section>
          )}

          {paso === 4 && (
            <section className="flex flex-col gap-7">
              <Pregunta titulo="Rango de presupuesto">
                <div className="mt-3 rounded-2xl bg-paper-dim/70 p-4">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="font-display text-2xl text-teal-dark" aria-live="polite">
                      {presupuestoRango === "flexible"
                        ? "Flexible"
                        : presupuestoRango
                          ? `Hasta ${labelPresupuesto(presupuestoRango)}`
                          : "Sin indicar"}
                    </p>
                    <Chip
                      activo={presupuestoRango === "flexible"}
                      onClick={() =>
                        setPresupuestoRango((v) => (v === "flexible" ? "" : "flexible"))
                      }
                    >
                      Flexible
                    </Chip>
                  </div>
                  <input
                    type="range"
                    min={PRESUPUESTO_MIN}
                    max={PRESUPUESTO_MAX}
                    step={PRESUPUESTO_PASO}
                    value={presupuestoNumero}
                    onChange={(e) => setPresupuestoRango(e.target.value)}
                    aria-label="Presupuesto máximo"
                    aria-valuetext={`Hasta ${labelPresupuesto(String(presupuestoNumero))}`}
                    className={`rango-presupuesto mt-4 w-full ${
                      presupuestoRango === "flexible" || !presupuestoRango ? "opacity-60" : ""
                    }`}
                    style={
                      {
                        "--relleno": `${presupuestoRango && presupuestoRango !== "flexible" ? porcentajePresupuesto : 0}%`,
                      } as React.CSSProperties
                    }
                  />
                  <div className="mt-1 flex justify-between text-xs text-ink-soft">
                    <span>{labelPresupuesto(String(PRESUPUESTO_MIN))}</span>
                    <span>{labelPresupuesto(String(PRESUPUESTO_MAX))}</span>
                  </div>
                </div>
              </Pregunta>

              <Pregunta titulo="A la hora de decidir, ¿qué es lo MÁS importante para ti?">
                <div role="radiogroup" className="mt-3 grid grid-cols-1 gap-2">
                  {PRIORIDAD_OPCIONES.map((o) => (
                    <OpcionTarjeta
                      key={o.valor}
                      activo={prioridadDecision === o.valor}
                      onClick={() => setPrioridadDecision(o.valor)}
                      titulo={o.nombre}
                    />
                  ))}
                </div>
              </Pregunta>

              <Pregunta titulo="Ubicación preferida para la cirugía">
                <div role="radiogroup" className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {DONDE_OPCIONES.map((o) => (
                    <OpcionTarjeta
                      key={o.valor}
                      activo={dondeTratamiento === o.valor}
                      onClick={() => setDondeTratamiento(o.valor)}
                      titulo={o.nombre}
                      detalle={o.detalle}
                    />
                  ))}
                </div>
              </Pregunta>

              <label className="block">
                <span className="text-[15px] font-semibold text-ink">Código postal</span>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="\d{5}"
                  maxLength={5}
                  value={codigoPostal}
                  onChange={(e) =>
                    setCodigoPostal(e.target.value.replace(/\D/g, "").slice(0, 5))
                  }
                  placeholder="Ej. 07001"
                  className={`${inputClass} max-w-[180px] tracking-widest`}
                />
                <span className="mt-1.5 block text-xs text-ink-soft">
                  Nos ayuda a acercarte a las clínicas más próximas a ti.
                </span>
              </label>

              <Pregunta titulo="Tiempo disponible para la cirugía">
                <div role="radiogroup" className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {CUANDO_OPCIONES.map((o) => (
                    <OpcionTarjeta
                      key={o.valor}
                      activo={cuandoTratamiento === o.valor}
                      onClick={() => setCuandoTratamiento(o.valor)}
                      titulo={o.nombre}
                      detalle={o.detalle}
                    />
                  ))}
                </div>
              </Pregunta>
            </section>
          )}

          {paso === 5 && (
            <section className="flex flex-col gap-7">
              <Pregunta titulo="Condiciones médicas" ayuda="Selecciona todas las que apliquen.">
                <div className="mt-3 flex flex-wrap gap-2">
                  {CONDICIONES_MEDICAS_INFO.map((c) => (
                    <Chip
                      key={c.valor}
                      activo={condicionesMedicas.includes(c.valor)}
                      onClick={() => toggleCondicionMedica(c.valor)}
                    >
                      {c.nombre}
                    </Chip>
                  ))}
                  <Chip
                    activo={condicionesMedicas.includes("ninguna")}
                    onClick={() => toggleCondicionMedica("ninguna")}
                  >
                    Ninguna
                  </Chip>
                </div>
              </Pregunta>

              <Pregunta titulo="¿Fumas actualmente?">
                <div role="radiogroup" className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
                  {FUMADOR_OPCIONES.map((o) => (
                    <OpcionTarjeta
                      key={o.valor}
                      activo={fumador === o.valor}
                      onClick={() => setFumador(o.valor)}
                      titulo={o.nombre}
                    />
                  ))}
                </div>
              </Pregunta>

              <label className="block">
                <span className="text-[15px] font-semibold text-ink">Alergias conocidas</span>
                <textarea
                  value={alergias}
                  onChange={(e) => setAlergias(e.target.value)}
                  rows={2}
                  placeholder="Lista cualquier alergia a medicamentos, anestesia, etc."
                  className={inputClass}
                />
              </label>

              <label className="block">
                <span className="text-[15px] font-semibold text-ink">Cirugías previas</span>
                <textarea
                  value={cirugiasPrevias}
                  onChange={(e) => setCirugiasPrevias(e.target.value)}
                  rows={2}
                  placeholder="Describe cualquier cirugía previa relevante"
                  className={inputClass}
                />
              </label>
            </section>
          )}

          {paso === 6 && (
            <section className="flex flex-col gap-3">
              <label
                className={`flex cursor-pointer items-center gap-3 rounded-2xl px-4 py-3.5 text-[15px] font-semibold transition-colors ${
                  todosLosConsentimientos ? "bg-teal text-white" : "bg-sage text-sage-ink"
                }`}
              >
                <input
                  type="checkbox"
                  checked={todosLosConsentimientos}
                  onChange={(e) => marcarTodosLosConsentimientos(e.target.checked)}
                  className="h-5 w-5 shrink-0 accent-teal-dark"
                />
                Aceptar todo
              </label>

              <Consentimiento
                checked={consentimientoDatos}
                onChange={setConsentimientoDatos}
                href="/legal/terminos#politica-de-privacidad"
                enlace="Política de privacidad"
                texto="Acepto el tratamiento de mis datos personales según la política de privacidad."
              />
              <Consentimiento
                checked={consentimientoInfoMedica}
                onChange={setConsentimientoInfoMedica}
                href="/legal/terminos#informacion-medica"
                enlace="Información médica"
                texto="Confirmo que la información médica proporcionada es veraz y completa."
              />
              <Consentimiento
                checked={consentimientoFotos}
                onChange={setConsentimientoFotos}
                href="/legal/terminos#uso-de-fotografias"
                enlace="Uso de fotografías"
                texto="Autorizo el uso de mis fotografías únicamente para evaluación médica."
              />
              <Consentimiento
                checked={consentimientoCompartir}
                onChange={setConsentimientoCompartir}
                href="/legal/terminos#comunicaciones-de-clinicas"
                enlace="Comunicaciones"
                texto="Acepto recibir comunicaciones de clínicas especializadas."
              />
              <Consentimiento
                checked={consentimientoTerminos}
                onChange={setConsentimientoTerminos}
                href="/legal/terminos"
                enlace="Términos de servicio"
                texto="He leído y acepto los términos y condiciones del servicio."
              />

              {errorEnvio && (
                <p
                  role="alert"
                  className="mt-2 rounded-xl bg-error/10 px-4 py-3 text-sm text-error-dark"
                >
                  {errorEnvio}
                </p>
              )}
            </section>
          )}
        </div>
      </div>

      {/* ── Navegación (fija abajo en móvil) ── */}
      <div className="sticky bottom-0 z-20 -mx-6 mt-6 border-t border-line bg-white/90 px-6 py-3 backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:px-0 sm:py-0 sm:backdrop-blur-none">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={anterior}
            disabled={paso === 1}
            className="press inline-flex items-center gap-1.5 rounded-xl px-3 py-3 text-sm font-medium text-ink-soft hover:text-teal disabled:invisible"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Atrás
          </button>

          {paso < TOTAL_PASOS ? (
            <button
              type="button"
              onClick={siguiente}
              className="press inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-teal px-6 py-3 text-[15px] font-semibold text-white transition-colors hover:bg-teal-dark sm:flex-none"
            >
              Siguiente
              <ArrowRight className="h-4 w-4" aria-hidden />
            </button>
          ) : (
            <button
              type="button"
              onClick={enviar}
              disabled={enviando || !todosLosConsentimientos}
              className="press inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-teal px-6 py-3 text-[15px] font-semibold text-white transition-colors hover:bg-teal-dark disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
            >
              {enviando ? (
                <>
                  <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden />
                  Enviando…
                </>
              ) : (
                <>
                  Enviar solicitud
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
