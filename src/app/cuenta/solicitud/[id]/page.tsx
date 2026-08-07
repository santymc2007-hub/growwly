import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SiteHeader } from "@/components/site-header";
import { BorrarSolicitudButton } from "./borrar-solicitud-button";

type Params = { id: string };

const PROGRESION: Record<string, string> = {
  lenta: "Lenta",
  moderada: "Moderada",
  rapida: "Rápida",
};
const CUANDO: Record<string, string> = {
  inmediatamente: "Inmediatamente",
  "3_meses": "En los próximos 3 meses",
  este_anio: "Lo está pensando — este año",
};
const DONDE: Record<string, string> = {
  solo_ciudad: "Solo en su ciudad/provincia",
  abierto_viajar: "Abierto/a a viajar por una buena oferta",
};
const PRESUPUESTO: Record<string, string> = {
  menos_3000: "Menos de 3.000€",
  "3000_5000": "3.000€ - 5.000€",
  "5000_7000": "5.000€ - 7.000€",
  mas_7000: "Más de 7.000€",
};

export default async function SolicitudDetallePage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/cuenta/login");
  }

  const { data: solicitud } = await supabase
    .from("solicitudes_presupuesto")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!solicitud) {
    notFound();
  }

  return (
    <main className="flex-1">
      <SiteHeader />

      <div className="mx-auto max-w-xl px-6 py-12">
        <Link
          href="/cuenta"
          className="text-sm font-medium text-cyan hover:text-cyan-dark"
        >
          ← Volver a mi cuenta
        </Link>

        <div className="mt-4 rounded-xl bg-sage p-5">
          <p className="font-display text-lg text-sage-ink">
            ¡Solicitud enviada!
          </p>
          <p className="mt-1 text-sm text-sage-ink">
            {solicitud.clinicas_notificadas === null
              ? "La estamos haciendo llegar a las clínicas que mejor encajen con lo que buscas."
              : solicitud.clinicas_notificadas > 0
                ? `Se la hemos hecho llegar a ${solicitud.clinicas_notificadas} ${
                    solicitud.clinicas_notificadas === 1 ? "clínica" : "clínicas"
                  }. Te avisaremos cuando tengas propuestas.`
                : "No hemos encontrado clínicas que encajen exactamente con esa ciudad o técnica todavía — puedes revisar tu solicitud o ampliar tus preferencias."}
          </p>
          {solicitud.notificacion_error && (
            <p className="mt-2 rounded-lg bg-white/60 px-3 py-2 text-xs text-sage-ink">
              Detalle técnico: {solicitud.notificacion_error}
            </p>
          )}
        </div>

        <div className="mt-6 flex items-center justify-between">
          <h1 className="font-display text-xl text-teal-dark">
            Resumen de tu solicitud
          </h1>
          <BorrarSolicitudButton id={solicitud.id} />
        </div>

        <dl className="mt-4 divide-y divide-line rounded-xl border border-line bg-white text-sm">
          {solicitud.ciudad && <Row label="Ciudad" value={solicitud.ciudad} />}
          {solicitud.progresion_perdida && (
            <Row
              label="Progresión de la pérdida"
              value={
                PROGRESION[solicitud.progresion_perdida] ??
                solicitud.progresion_perdida
              }
            />
          )}
          {solicitud.tratamientos_interes.length > 0 && (
            <Row
              label="Tratamientos de interés"
              value={solicitud.tratamientos_interes.join(", ")}
            />
          )}
          {solicitud.dejar_decidir_medico && (
            <Row
              label="Tratamiento"
              value="Deja que el médico decida la mejor técnica"
            />
          )}
          {solicitud.cuando_tratamiento && (
            <Row
              label="Cuándo"
              value={CUANDO[solicitud.cuando_tratamiento] ?? solicitud.cuando_tratamiento}
            />
          )}
          {solicitud.donde_tratamiento && (
            <Row
              label="Dónde"
              value={DONDE[solicitud.donde_tratamiento] ?? solicitud.donde_tratamiento}
            />
          )}
          {solicitud.presupuesto_rango && (
            <Row
              label="Presupuesto"
              value={
                PRESUPUESTO[solicitud.presupuesto_rango] ??
                solicitud.presupuesto_rango
              }
            />
          )}
          <Row
            label="Fotos vinculadas"
            value={solicitud.estudio_id ? "Sí" : "No"}
          />
        </dl>
      </div>
    </main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 px-4 py-3">
      <dt className="text-ink-soft">{label}</dt>
      <dd className="text-right text-ink">{value}</dd>
    </div>
  );
}
