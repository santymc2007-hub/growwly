import Link from "next/link";
import { Lock, Eye, Unlock, ChevronRight } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { SiteHeader } from "@/components/site-header";
import { ClinicaNav } from "../clinica-nav";
import { requireClinicaActiva } from "@/lib/clinica/contexto-activo";
import { SelectorClinica } from "@/components/clinica/selector-clinica";
import { ClinicaHeaderPerfil } from "@/components/clinica/clinica-header-perfil";
import { obtenerNombreGestor } from "@/lib/clinica/perfil-gestor";

type Estado = "enviado" | "visto" | "desbloqueado";
type SearchParams = { estado?: string };

const ESTADO_INFO: Record<
  Estado,
  {
    label: string;
    icono: typeof Lock;
    tarjeta: string;
    badge: string;
    mensaje: string;
  }
> = {
  enviado: {
    label: "Nuevo",
    icono: Lock,
    tarjeta: "border-yellow/50 bg-yellow/15 hover:border-yellow",
    badge: "bg-yellow text-teal-dark",
    mensaje:
      "Esta petición la han recibido varias clínicas — sé el primero en desbloquearla y contactar con el cliente.",
  },
  visto: {
    label: "Visto, sin gestionar",
    icono: Eye,
    tarjeta: "border-error/30 bg-error/10 hover:border-error/50",
    badge: "bg-error/20 text-error-dark",
    mensaje:
      "La has visto pero todavía no la has desbloqueado — no dejes que otra clínica se adelante.",
  },
  desbloqueado: {
    label: "Desbloqueado",
    icono: Unlock,
    tarjeta: "border-sage-ink/20 bg-sage hover:border-sage-ink/40",
    badge: "bg-sage-ink/15 text-sage-ink",
    mensaje: "Ya tienes acceso completo al perfil de este paciente.",
  },
};

const FILTROS: { valor: Estado | "todos"; label: string }[] = [
  { valor: "todos", label: "Todas" },
  { valor: "enviado", label: "Nuevas" },
  { valor: "visto", label: "Vistas sin gestionar" },
  { valor: "desbloqueado", label: "Desbloqueadas" },
];

export default async function SolicitudesClinicaPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { estado: filtro } = await searchParams;
  const { clinicId, profileId, clinicas } = await requireClinicaActiva();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const admin = createAdminClient();
  const [{ data: leads }, { data: clinic }, nombreGestor] = await Promise.all([
    admin
      .from("leads_clinica")
      .select("*")
      .eq("clinic_id", clinicId)
      .order("enviado_en", { ascending: false }),
    admin
      .from("clinics")
      .select("nombre, logo_url, fotos")
      .eq("id", clinicId)
      .maybeSingle(),
    obtenerNombreGestor(profileId),
  ]);
  const todos = leads ?? [];
  const solicitudesPendientes = todos.filter((l) => l.estado === "enviado").length;
  const fotoPrincipal = clinic?.logo_url ?? clinic?.fotos?.[0] ?? null;

  const leadsFiltrados =
    filtro && filtro !== "todos" ? todos.filter((l) => l.estado === filtro) : todos;

  return (
    <main className="flex-1 bg-gradient-to-b from-sage/25 to-transparent">
      <SiteHeader />
      <div className="mx-auto max-w-[1200px] px-6 py-12">
        <ClinicaHeaderPerfil
          nombreClinica={clinic?.nombre ?? "Panel de clínica"}
          fotoPrincipal={fotoPrincipal}
          email={user?.email ?? ""}
          nombreGestor={nombreGestor}
        />

        <div className="mt-4">
          <SelectorClinica clinicas={clinicas} clinicaActivaId={clinicId} />
        </div>

        <div className="mt-4">
          <ClinicaNav activo="solicitudes" solicitudesPendientes={solicitudesPendientes} />
        </div>

        <h2 className="border-b border-line pb-2 font-display text-lg text-teal-dark">
          Solicitudes de presupuesto
        </h2>

        {todos.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {FILTROS.map((f) => {
              const activo = (filtro ?? "todos") === f.valor;
              const cantidad =
                f.valor === "todos"
                  ? todos.length
                  : todos.filter((l) => l.estado === f.valor).length;
              return (
                <Link
                  key={f.valor}
                  href={
                    f.valor === "todos"
                      ? "/clinica/solicitudes"
                      : `/clinica/solicitudes?estado=${f.valor}`
                  }
                  className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                    activo
                      ? "border-teal bg-teal text-paper"
                      : "border-line bg-white text-ink-soft hover:border-teal/40 hover:text-teal"
                  }`}
                >
                  {f.label}
                  <span
                    className={`flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] ${
                      activo ? "bg-white/20" : "bg-paper-dim"
                    }`}
                  >
                    {cantidad}
                  </span>
                </Link>
              );
            })}
          </div>
        )}

        {leadsFiltrados.length > 0 ? (
          <ul className="mt-4 flex flex-col gap-3">
            {leadsFiltrados.map((lead) => {
              const info = ESTADO_INFO[lead.estado as Estado] ?? ESTADO_INFO.enviado;
              const Icono = info.icono;
              return (
                <li key={lead.id}>
                  <Link
                    href={`/leads/${lead.token}`}
                    className={`flex items-center gap-4 rounded-2xl border p-4 transition ${info.tarjeta}`}
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white shadow-sm">
                      <Icono className="h-5 w-5 text-teal-dark" aria-hidden />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-ink">{info.mensaje}</p>
                      <p className="mt-1 text-xs text-ink-soft">
                        {new Date(lead.enviado_en).toLocaleDateString("es-ES", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                    <span
                      className={`hidden shrink-0 rounded-full px-3 py-1 text-xs font-bold sm:inline-block ${info.badge}`}
                    >
                      {info.label}
                    </span>
                    <ChevronRight className="h-5 w-5 shrink-0 text-ink-soft" aria-hidden />
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="mt-4 text-sm text-ink-soft">
            {todos.length === 0
              ? "Todavía no tienes solicitudes de presupuesto."
              : "No hay solicitudes en este filtro."}
          </p>
        )}
      </div>
    </main>
  );
}
