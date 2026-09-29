import Image from "next/image";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { urlFirmadaFoto } from "@/lib/supabase/estudios-storage";
import { InformeCapilarVista } from "@/components/informe/informe-capilar";
import { leerInforme } from "@/lib/informe/sanear";
import { CONTENIDO_FLUJOS } from "@/lib/informe/flujos";
import { calcularFiabilidad } from "@/lib/informe/fiabilidad";

type Params = { token: string };

/**
 * La valoración capilar tal y como la vio el paciente, para la clínica
 * a la que le ha llegado su solicitud. Sin nombre del paciente (eso
 * solo llega si la elige) y sin botones del paciente.
 */
export default async function ValoracionLeadPage({ params }: { params: Promise<Params> }) {
  const { token } = await params;
  const admin = createAdminClient();

  const { data: lead } = await admin
    .from("leads_clinica")
    .select("solicitud_id")
    .eq("token", token)
    .maybeSingle();
  if (!lead) notFound();

  const { data: solicitud } = await admin
    .from("solicitudes_presupuesto")
    .select("estudio_id")
    .eq("id", lead.solicitud_id)
    .maybeSingle();
  if (!solicitud?.estudio_id) notFound();

  const { data: estudio } = await admin
    .from("estudios_capilares")
    .select("id, created_at, estado, informe")
    .eq("id", solicitud.estudio_id)
    .maybeSingle();
  const informe = estudio?.estado === "listo" ? leerInforme(estudio.informe) : null;
  if (!estudio || !informe) notFound();

  const fotos = await Promise.all(
    informe.fotos.map(async (f) => ({
      url: await urlFirmadaFoto(admin, f.ruta),
      angulo: f.angulo,
      calidad: f.calidad,
    })),
  );
  const fecha = new Date(estudio.created_at).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <main className="flex-1 bg-gradient-to-b from-sage/25 to-transparent">
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-6 py-3">
          <Image
            src="/brand/growwly-logo-gradient.png"
            alt="Growwly"
            width={102}
            height={35}
            className="h-8 w-auto"
          />
          <span className="text-sm font-medium text-ink-soft">Panel de clínica</span>
        </div>
      </header>
      <div className="mx-auto max-w-[1400px] px-3 pb-10 pt-8 sm:px-6">
        <InformeCapilarVista
          estudioId={estudio.id}
          fecha={fecha}
          nombre={null}
          informe={informe}
          contenido={CONTENIDO_FLUJOS[informe.flujo]}
          fiabilidad={calcularFiabilidad(informe)}
          fotos={fotos}
          vistaClinica={{ volverHref: `/clinica/solicitudes?abierto=${token}#lead-${token}` }}
        />
      </div>
    </main>
  );
}
