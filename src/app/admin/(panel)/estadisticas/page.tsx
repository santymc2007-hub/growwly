import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { calcularEstadisticasAdmin } from "@/lib/admin/estadisticas-admin";
import { GraficoLineas } from "@/components/estadisticas/grafico-lineas";
import { BarraCategoria } from "@/components/estadisticas/barra-categoria";

export const dynamic = "force-dynamic";

type SearchParams = { rango?: string };

const RANGOS = [
  { valor: "7", label: "7 días" },
  { valor: "30", label: "30 días" },
  { valor: "90", label: "90 días" },
] as const;

function tarjeta(titulo: string, valor: string) {
  return (
    <div className="rounded-2xl border border-line bg-white p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-ink-soft">{titulo}</p>
      <p className="mt-1.5 font-display text-3xl text-teal-dark">{valor}</p>
    </div>
  );
}

export default async function EstadisticasAdminPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { rango: rangoParam } = await searchParams;
  const rango = RANGOS.some((r) => r.valor === rangoParam) ? rangoParam! : "30";
  const dias = Number(rango);

  const hasta = new Date();
  const desde = new Date();
  desde.setDate(desde.getDate() - (dias - 1));

  const admin = createAdminClient();
  const stats = await calcularEstadisticasAdmin(admin, desde, hasta);

  const maxFunnel = stats.funnel[0]?.total ?? 0;
  const lookerUrl = process.env.NEXT_PUBLIC_LOOKER_STUDIO_URL;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl text-teal-dark">Estadísticas</h1>
          <p className="mt-1 text-sm text-ink-soft">Vista general del negocio, para marketing y el día a día.</p>
        </div>
        <div className="inline-flex rounded-full border border-line bg-white p-1">
          {RANGOS.map((r) => (
            <Link
              key={r.valor}
              href={`/admin/estadisticas?rango=${r.valor}`}
              className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
                rango === r.valor ? "bg-teal-dark text-white" : "text-ink-soft hover:text-teal-dark"
              }`}
            >
              {r.label}
            </Link>
          ))}
        </div>
      </div>

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
                <BarraCategoria
                  key={c.clinicId}
                  etiqueta={c.nombre}
                  valor={c.total}
                  total={stats.clinicasMasVistas[0]?.total ?? 0}
                  color="#00c2d6"
                />
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
                <BarraCategoria
                  key={c.clinicId}
                  etiqueta={c.nombre}
                  valor={c.total}
                  total={stats.clinicasMasLeads[0]?.total ?? 0}
                  color="#00768f"
                />
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
              variable de entorno <code className="rounded bg-paper-dim px-1">NEXT_PUBLIC_LOOKER_STUDIO_URL</code> en
              Vercel.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
