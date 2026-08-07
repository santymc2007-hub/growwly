import { notFound } from "next/navigation";
import Image from "next/image";
import { createAdminClient } from "@/lib/supabase/admin";

type Params = { token: string };

const PROGRESION: Record<string, string> = {
  lenta: "Lenta",
  moderada: "Moderada",
  rapida: "Rápida",
};
const CUANDO: Record<string, string> = {
  inmediatamente: "Inmediatamente",
  "3_meses": "En los próximos 3 meses",
  este_anio: "Este año, sin prisa",
};
const PRESUPUESTO: Record<string, string> = {
  menos_3000: "Menos de 3.000€",
  "3000_5000": "3.000€ - 5.000€",
  "5000_7000": "5.000€ - 7.000€",
  mas_7000: "Más de 7.000€",
};

export default async function LeadPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { token } = await params;
  const supabase = createAdminClient();

  const { data: lead } = await supabase
    .from("leads_clinica")
    .select("*")
    .eq("token", token)
    .maybeSingle();

  if (!lead) {
    notFound();
  }

  const [{ data: solicitud }, { data: clinica }] = await Promise.all([
    supabase
      .from("solicitudes_presupuesto")
      .select("*")
      .eq("id", lead.solicitud_id)
      .maybeSingle(),
    supabase.from("clinics").select("nombre").eq("id", lead.clinic_id).maybeSingle(),
  ]);

  if (!solicitud) {
    notFound();
  }

  let resumenIA: string | null = null;
  if (solicitud.estudio_id) {
    const { data: estudio } = await supabase
      .from("estudios_capilares")
      .select("resultado_texto")
      .eq("id", solicitud.estudio_id)
      .maybeSingle();
    resumenIA = estudio?.resultado_texto ?? null;
  }

  if (lead.estado === "enviado") {
    await supabase
      .from("leads_clinica")
      .update({ estado: "visto", visto_en: new Date().toISOString() })
      .eq("id", lead.id);
  }

  return (
    <main className="flex-1">
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-2xl items-center px-6 py-3">
          <Image
            src="/brand/growwly-logo-light-bg.png"
            alt="Growwly"
            width={140}
            height={35}
            className="h-8 w-auto"
          />
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-6 py-12">
        <p className="text-sm uppercase tracking-wide text-ink-soft">
          Solicitud de presupuesto
        </p>
        <h1 className="mt-2 font-display text-2xl text-teal-dark">
          {clinica?.nombre ? `Hola, ${clinica.nombre}` : "Nueva solicitud"}
        </h1>
        <p className="mt-2 text-sm text-ink-soft">
          Un paciente de Growwly ha pedido presupuesto y tu clínica encaja
          con lo que busca. Esta es la información que puedes ver antes de
          decidir si quieres enviarle una propuesta.
        </p>

        <dl className="mt-6 divide-y divide-line rounded-xl border border-line bg-white text-sm">
          {solicitud.ciudad && <Row label="Ciudad" value={solicitud.ciudad} />}
          {solicitud.tratamientos_interes.length > 0 && (
            <Row
              label="Tratamientos de interés"
              value={solicitud.tratamientos_interes.join(", ")}
            />
          )}
          {solicitud.dejar_decidir_medico && (
            <Row
              label="Tratamiento"
              value="El paciente deja que el médico decida la técnica"
            />
          )}
          {solicitud.progresion_perdida && (
            <Row
              label="Progresión de la pérdida"
              value={
                PROGRESION[solicitud.progresion_perdida] ??
                solicitud.progresion_perdida
              }
            />
          )}
          {solicitud.cuando_tratamiento && (
            <Row
              label="Cuándo"
              value={CUANDO[solicitud.cuando_tratamiento] ?? solicitud.cuando_tratamiento}
            />
          )}
          {solicitud.presupuesto_rango && (
            <Row
              label="Presupuesto aproximado"
              value={
                PRESUPUESTO[solicitud.presupuesto_rango] ??
                solicitud.presupuesto_rango
              }
            />
          )}
        </dl>

        {resumenIA && (
          <div className="mt-4 rounded-xl bg-sage p-4 text-sm text-sage-ink">
            <p className="font-medium">Primera impresión orientativa</p>
            <p className="mt-1">{resumenIA}</p>
          </div>
        )}

        <div className="mt-8 rounded-xl border border-dashed border-line bg-white p-6 text-center">
          <p className="font-display text-lg text-teal-dark">
            Desbloquear perfil completo
          </p>
          <p className="mt-1 text-sm text-ink-soft">
            Muy pronto podrás desbloquear los datos de contacto del paciente
            aquí mismo, con pago por lead. Mientras tanto, escríbenos y te lo
            gestionamos a mano.
          </p>
        </div>
      </div>
    </main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 px-4 py-3">
      <dt className="text-ink-soft">{label}</dt>
      <dd className="text-right font-medium text-ink">{value}</dd>
    </div>
  );
}
