import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { SiteHeader } from "@/components/site-header";
import { ClinicaNav } from "../clinica-nav";
import { requireClinicaActiva } from "@/lib/clinica/contexto-activo";
import { SelectorClinica } from "@/components/clinica/selector-clinica";
import { ClinicaHeaderPerfil } from "@/components/clinica/clinica-header-perfil";
import { contarSolicitudesPendientes } from "@/lib/clinica/solicitudes-pendientes";
import { obtenerNombreGestor } from "@/lib/clinica/perfil-gestor";
import { calcularEstadisticasClinica } from "@/lib/clinica/estadisticas-clinica";
import { GraficoLineas } from "@/components/estadisticas/grafico-lineas";
import { BarraCategoria } from "@/components/estadisticas/barra-categoria";
import { BloqueoPremium } from "@/components/estadisticas/bloqueo-premium";

type SearchParams = { rango?: string };

const RANGOS = [
  { valor: "7", label: "7 días" },
  { valor: "30", label: "30 días" },
  { valor: "90", label: "90 días" },
] as const;

const METODO_LABEL: Record<string, string> = {
  llamar: "Llamadas",
  whatsapp: "WhatsApp",
  web: "Sitio web",
  reserva_online: "Reserva online",
  ver_mapa: "Ver en el mapa",
  pedir_cita: "Pedir cita (formulario)",
};

const ESTADO_LABEL: Record<string, string> = {
  enviado: "Nuevo",
  visto: "Visto, sin gestionar",
  propuesta_enviada: "Propuesta enviada",
  seleccionado: "Elegida",
  no_seleccionado: "No elegida",
  cita_pendiente: "Cita pendiente",
  cita_programada: "Cita programada",
  cita_realizada: "Cita realizada",
  convertido: "Tratamiento realizado",
  no_convertido: "No convertido",
  cancelado: "Cancelado",
};

function tarjeta(titulo: string, valor: string, nota?: string) {
  return (
    <div className="rounded-2xl border border-line bg-white p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-ink-soft">{titulo}</p>
      <p className="mt-1.5 font-display text-3xl text-teal-dark">{valor}</p>
      {nota && <p className="mt-1 text-xs text-ink-soft">{nota}</p>}
    </div>
  );
}

export default async function EstadisticasClinicaPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { rango: rangoParam } = await searchParams;
  const rango = RANGOS.some((r) => r.valor === rangoParam) ? rangoParam! : "30";
  const dias = Number(rango);

  const { clinicId, profileId, clinicas } = await requireClinicaActiva();

  const authSupabase = await createClient();
  const {
    data: { user },
  } = await authSupabase.auth.getUser();

  const admin = createAdminClient();
  const { data: clinic } = await admin
    .from("clinics")
    .select("nombre, logo_url, fotos, plan")
    .eq("id", clinicId)
    .maybeSingle();

  if (!clinic) {
    notFound();
  }

  const hasta = new Date();
  const desde = new Date();
  desde.setDate(desde.getDate() - (dias - 1));

  const [solicitudesPendientes, nombreGestor, stats] = await Promise.all([
    contarSolicitudesPendientes(clinicId),
    obtenerNombreGestor(profileId),
    calcularEstadisticasClinica(admin, clinicId, desde, hasta),
  ]);

  const fotoPrincipal = clinic.logo_url ?? clinic.fotos?.[0] ?? null;
  const esPremium = clinic.plan === "premium";

  return (
    <main className="flex-1 bg-gradient-to-b from-sage/25 to-transparent">
      <SiteHeader />
      <div className="mx-auto max-w-[1200px] px-6 py-12">
        <ClinicaHeaderPerfil
          nombreClinica={clinic.nombre}
          fotoPrincipal={fotoPrincipal}
          email={user?.email ?? ""}
          nombreGestor={nombreGestor}
        />

        <div className="mt-4">
          <SelectorClinica clinicas={clinicas} clinicaActivaId={clinicId} />
        </div>

        <div className="mt-4">
          <ClinicaNav activo="estadisticas" solicitudesPendientes={solicitudesPendientes} />
        </div>

        <div className="mb-6 flex items-center justify-between">
          <p className="text-sm text-ink-soft">
            Cómo le está yendo a tu ficha en Growwly.
          </p>
          <div className="inline-flex rounded-full border border-line bg-white p-1">
            {RANGOS.map((r) => (
              <Link
                key={r.valor}
                href={`/clinica/estadisticas?rango=${r.valor}`}
                className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
                  rango === r.valor
                    ? "bg-teal-dark text-white"
                    : "text-ink-soft hover:text-teal-dark"
                }`}
              >
                {r.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {tarjeta("Vistas de ficha", stats.vistasTotal.toLocaleString("es-ES"))}
          {tarjeta("Contactos", stats.contactosTotal.toLocaleString("es-ES"))}
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-line bg-white p-5">
            <h2 className="font-display text-lg text-teal-dark">Vistas de ficha</h2>
            <div className="mt-2">
              <GraficoLineas datos={stats.vistasPorDia} color="#00c2d6" etiqueta="Vistas" />
            </div>
          </div>
          <div className="rounded-2xl border border-line bg-white p-5">
            <h2 className="font-display text-lg text-teal-dark">Contactos por método</h2>
            {stats.contactosPorMetodo.length === 0 ? (
              <p className="mt-3 text-sm text-ink-soft">Todavía no hay contactos en este rango.</p>
            ) : (
              <div className="mt-4 flex flex-col gap-3">
                {stats.contactosPorMetodo.map((c) => (
                  <BarraCategoria
                    key={c.metodo}
                    etiqueta={METODO_LABEL[c.metodo] ?? c.metodo}
                    valor={c.total}
                    total={stats.contactosTotal}
                    color="#25D366"
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mt-10 mb-4 flex items-center gap-3">
          <span className="rounded-full bg-yellow px-3 py-1 text-xs font-bold uppercase tracking-wide text-teal-dark">
            Info PREMIUM
          </span>
          <div className="h-px flex-1 bg-line" />
          {!esPremium && (
            <p className="text-xs text-ink-soft">
              Estas métricas se activan con el perfil PREMIUM.
            </p>
          )}
        </div>

        <BloquePremium activo={esPremium}>
          <div className="grid grid-cols-2 gap-4">
            {tarjeta("Leads recibidos", stats.leadsTotal.toLocaleString("es-ES"))}
            {tarjeta(
              "Elegida por el paciente",
              stats.tasaEleccion != null ? `${Math.round(stats.tasaEleccion * 100)}%` : "—",
              "de los leads recibidos",
            )}
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-line bg-white p-5">
              <h2 className="font-display text-lg text-teal-dark">Leads recibidos</h2>
              <div className="mt-2">
                <GraficoLineas datos={stats.leadsPorDia} color="#1f5568" etiqueta="Leads" />
              </div>
            </div>
            <div className="rounded-2xl border border-line bg-white p-5">
              <h2 className="font-display text-lg text-teal-dark">Leads por estado</h2>
              {stats.leadsPorEstado.length === 0 ? (
                <p className="mt-3 text-sm text-ink-soft">Todavía no hay leads en este rango.</p>
              ) : (
                <div className="mt-4 flex flex-col gap-3">
                  {stats.leadsPorEstado.map((l) => (
                    <BarraCategoria
                      key={l.estado}
                      etiqueta={ESTADO_LABEL[l.estado] ?? l.estado}
                      valor={l.total}
                      total={stats.leadsTotal}
                      color="#00768f"
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </BloquePremium>
      </div>
    </main>
  );
}

function BloquePremium({ activo, children }: { activo: boolean; children: React.ReactNode }) {
  if (activo) return <>{children}</>;
  return <BloqueoPremium>{children}</BloqueoPremium>;
}
