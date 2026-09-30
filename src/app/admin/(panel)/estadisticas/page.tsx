import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { calcularEstadisticasAdmin } from "@/lib/admin/estadisticas-admin";
import { calcularEstadisticasClinica } from "@/lib/clinica/estadisticas-clinica";
import { GraficoLineas } from "@/components/estadisticas/grafico-lineas";
import { BarraCategoria } from "@/components/estadisticas/barra-categoria";
import { FiltrosEstadisticasAdmin } from "@/components/estadisticas/filtros-estadisticas-admin";
import { ESTADO_COLOR } from "@/lib/leads/estado-color";
import type { EstadoLead } from "@/lib/leads/estados-lead";

export const dynamic = "force-dynamic";

type SearchParams = { rango?: string; provincia?: string; clinica?: string };

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

function tarjeta(titulo: string, valor: string) {
  return (
    <div className="rounded-2xl border border-line bg-white p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-ink-soft">{titulo}</p>
      <p className="mt-1.5 font-display text-3xl text-teal-dark">{valor}</p>
    </div>
  );
}

function selectorRango(rango: string) {
  return (
    <div className="inline-flex rounded-full border border-line bg-white p-1">
      {RANGOS.map((r) => (
        <Link
          key={r.valor}
          href={`?rango=${r.valor}`}
          className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
            rango === r.valor ? "bg-teal-dark text-white" : "text-ink-soft hover:text-teal-dark"
          }`}
        >
          {r.label}
        </Link>
      ))}
    </div>
  );
}

export default async function EstadisticasAdminPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { rango: rangoParam, provincia, clinica: clinicaId } = await searchParams;
  const rango = RANGOS.some((r) => r.valor === rangoParam) ? rangoParam! : "30";
  const dias = Number(rango);

  const hasta = new Date();
  const desde = new Date();
  desde.setDate(desde.getDate() - (dias - 1));

  const admin = createAdminClient();

  const { data: todasLasClinicas } = await admin
    .from("clinics")
    .select("id, nombre, provincia")
    .order("nombre", { ascending: true });
  const clinicas = todasLasClinicas ?? [];
  const provincias = Array.from(new Set(clinicas.map((c) => c.provincia))).sort((a, b) =>
    a.localeCompare(b, "es"),
  );

  const cabecera = (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 className="font-display text-2xl text-teal-dark">Estadísticas</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Vista general del negocio, para marketing y el día a día.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <FiltrosEstadisticasAdmin provincias={provincias} clinicas={clinicas} />
        {selectorRango(rango)}
      </div>
    </div>
  );

  // --- Vista de una clínica concreta: la misma que ve la propia clínica ---
  if (clinicaId) {
    const clinica = clinicas.find((c) => c.id === clinicaId);
    const stats = await calcularEstadisticasClinica(admin, clinicaId, desde, hasta);

    return (
      <div>
        {cabecera}

        <p className="mb-4 text-sm text-ink-soft">
          Viendo solo <strong className="text-ink">{clinica?.nombre ?? "esta clínica"}</strong> —{" "}
          <Link href={`?rango=${rango}`} className="text-cyan-dark hover:underline">
            quitar filtro
          </Link>
        </p>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {tarjeta("Vistas de ficha", stats.vistasTotal.toLocaleString("es-ES"))}
          {tarjeta("Contactos", stats.contactosTotal.toLocaleString("es-ES"))}
          {tarjeta("Leads recibidos", stats.leadsTotal.toLocaleString("es-ES"))}
          {tarjeta(
            "Elegida por el paciente",
            stats.tasaEleccion != null ? `${Math.round(stats.tasaEleccion * 100)}%` : "—",
          )}
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-line bg-white p-5">
            <h2 className="font-display text-lg text-teal-dark">Vistas de ficha</h2>
            <div className="mt-2">
              <GraficoLineas datos={stats.vistasPorDia} color="#00c2d6" etiqueta="Vistas" />
            </div>
          </div>
          <div className="rounded-2xl border border-line bg-white p-5">
            <h2 className="font-display text-lg text-teal-dark">Leads recibidos</h2>
            <div className="mt-2">
              <GraficoLineas datos={stats.leadsPorDia} color="#1f5568" etiqueta="Leads" />
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-line bg-white p-5">
            <h2 className="font-display text-lg text-teal-dark">Contactos por método</h2>
            {stats.contactosPorMetodo.length === 0 ? (
              <p className="mt-3 text-sm text-ink-soft">Sin contactos en este rango.</p>
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
          <div className="rounded-2xl border border-line bg-white p-5">
            <h2 className="font-display text-lg text-teal-dark">Leads por estado</h2>
            {stats.leadsPorEstado.length === 0 ? (
              <p className="mt-3 text-sm text-ink-soft">Sin leads en este rango.</p>
            ) : (
              <div className="mt-4 flex flex-col gap-3">
                {stats.leadsPorEstado.map((l) => (
                  <BarraCategoria
                    key={l.estado}
                    etiqueta={ESTADO_LABEL[l.estado] ?? l.estado}
                    valor={l.total}
                    total={stats.leadsTotal}
                    color={ESTADO_COLOR[l.estado as EstadoLead] ?? "#00768f"}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // --- Vista agregada (todas las clínicas, o filtradas por provincia) ---
  const stats = await calcularEstadisticasAdmin(admin, desde, hasta, { provincia });
  const maxFunnel = stats.funnel[0]?.total ?? 0;
  const lookerUrl = process.env.NEXT_PUBLIC_LOOKER_STUDIO_URL;

  return (
    <div>
      {cabecera}

      {provincia && (
        <p className="mb-4 text-sm text-ink-soft">
          Viendo solo <strong className="text-ink">{provincia}</strong> —{" "}
          <Link href={`?rango=${rango}`} className="text-cyan-dark hover:underline">
            quitar filtro
          </Link>
        </p>
      )}

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {tarjeta("Vistas de fichas", stats.visitasTotal.toLocaleString("es-ES"))}
        {tarjeta("Solicitudes creadas", stats.solicitudesCreadas.toLocaleString("es-ES"))}
        {tarjeta("Leads asignados", (stats.funnel[1]?.total ?? 0).toLocaleString("es-ES"))}
        {tarjeta(
          "Tasa de elección",
          stats.funnel[1]?.total
            ? `${Math.round(((stats.funnel[3]?.total ?? 0) / stats.funnel[1].total) * 100)}%`
            : "—",
        )}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1.3fr_1fr]">
        <div className="rounded-2xl border border-line bg-white p-5">
          <h2 className="font-display text-lg text-teal-dark">Funnel de negocio</h2>
          <div className="mt-4 flex flex-col gap-3">
            {stats.funnel.map((paso) => (
              <BarraCategoria
                key={paso.clave}
                etiqueta={paso.etiqueta}
                valor={paso.total}
                total={maxFunnel}
                color="#00768f"
              />
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-line bg-white p-5">
          <h2 className="font-display text-lg text-teal-dark">Vistas de fichas</h2>
          <div className="mt-2">
            <GraficoLineas datos={stats.visitasPorDia} color="#00c2d6" etiqueta="Vistas" />
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-line bg-white p-5">
          <h2 className="font-display text-lg text-teal-dark">Pacientes por sexo</h2>
          {stats.porSexo.length === 0 ? (
            <p className="mt-3 text-sm text-ink-soft">Sin solicitudes en este rango.</p>
          ) : (
            <div className="mt-4 flex flex-col gap-3">
              {stats.porSexo.map((s) => (
                <BarraCategoria
                  key={s.etiqueta}
                  etiqueta={s.etiqueta}
                  valor={s.total}
                  total={stats.solicitudesCreadas}
                  color="#1f6b43"
                />
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-line bg-white p-5">
          <h2 className="font-display text-lg text-teal-dark">Solicitudes por ciudad</h2>
          {stats.porCiudad.length === 0 ? (
            <p className="mt-3 text-sm text-ink-soft">Sin solicitudes en este rango.</p>
          ) : (
            <div className="mt-4 flex flex-col gap-3">
              {stats.porCiudad.map((c) => (
                <BarraCategoria
                  key={c.ciudad}
                  etiqueta={c.ciudad}
                  valor={c.total}
                  total={stats.solicitudesCreadas}
                  color="#0098a8"
                />
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-line bg-white p-5">
          <h2 className="font-display text-lg text-teal-dark">Clínicas más vistas</h2>
          {stats.clinicasMasVistas.length === 0 ? (
            <p className="mt-3 text-sm text-ink-soft">Sin vistas en este rango.</p>
          ) : (
            <div className="mt-4 flex flex-col gap-3">
              {stats.clinicasMasVistas.map((c) => (
                <Link key={c.clinicId} href={`?rango=${rango}&clinica=${c.clinicId}`} className="block">
                  <BarraCategoria
                    etiqueta={c.nombre}
                    valor={c.total}
                    total={stats.clinicasMasVistas[0]?.total ?? 0}
                    color="#00c2d6"
                  />
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-line bg-white p-5">
          <h2 className="font-display text-lg text-teal-dark">Clínicas con más leads</h2>
          {stats.clinicasMasLeads.length === 0 ? (
            <p className="mt-3 text-sm text-ink-soft">Sin leads en este rango.</p>
          ) : (
            <div className="mt-4 flex flex-col gap-3">
              {stats.clinicasMasLeads.map((c) => (
                <Link key={c.clinicId} href={`?rango=${rango}&clinica=${c.clinicId}`} className="block">
                  <BarraCategoria
                    etiqueta={c.nombre}
                    valor={c.total}
                    total={stats.clinicasMasLeads[0]?.total ?? 0}
                    color="#00768f"
                  />
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-line bg-white p-5">
          <h2 className="font-display text-lg text-teal-dark">Tráfico web (Google Analytics)</h2>
          {lookerUrl ? (
            <iframe
              src={lookerUrl}
              className="mt-4 aspect-[4/3] w-full rounded-xl border border-line"
              allowFullScreen
            />
          ) : (
            <p className="mt-3 text-sm text-ink-soft">
              Todavía no hay un informe de Looker Studio configurado. Crea uno conectado a
              GA4, copia su enlace de inserción (Compartir → Insertar informe) y pégalo en la
              variable de entorno{" "}
              <code className="rounded bg-paper-dim px-1">NEXT_PUBLIC_LOOKER_STUDIO_URL</code> en
              Vercel.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
