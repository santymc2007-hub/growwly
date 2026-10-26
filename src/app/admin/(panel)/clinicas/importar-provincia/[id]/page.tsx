import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { Seguimiento } from "./seguimiento";
import { Revision } from "./revision";

export const dynamic = "force-dynamic";
// Descargar y guardar cientos de resultados de Apify puede tardar.
export const maxDuration = 60;

export default async function ImportacionPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const supabase = createAdminClient();

  const { data: imp } = await supabase.from("importaciones_provincia").select("*").eq("id", id).maybeSingle();
  if (!imp) notFound();

  const { data: candidatos } = await supabase
    .from("importacion_candidatos")
    .select("*")
    .eq("importacion_id", id)
    .order("municipio")
    .order("nombre");

  return (
    <div className="max-w-[1200px]">
      <Link href="/admin/clinicas/importar-provincia" className="text-sm font-medium text-cyan hover:text-cyan-dark">
        ← Volver a importaciones
      </Link>
      <h1 className="mt-4 font-display text-2xl text-teal-dark">Importación · {imp.provincia}</h1>
      <p className="mt-1 text-sm text-ink-soft">
        {imp.zona_busqueda} · {new Date(imp.created_at).toLocaleString("es-ES")}
      </p>

      {error && <p className="mt-4 rounded-lg bg-error/10 px-4 py-3 text-sm text-error-dark">{error}</p>}
      <p className="mt-1 text-sm">
        <a
          href={`https://console.apify.com/view/runs/${imp.run_id}`}
          target="_blank"
          rel="noopener"
          className="text-cyan hover:underline"
        >
          Ver ejecución en Apify
        </a>
      </p>
      {imp.estado === "cargada" && imp.total_resultados === 0 && (
        <p className="mt-4 rounded-lg bg-error/10 px-4 py-3 text-sm text-error-dark">
          Apify no encontró nada. Revisa en su log la línea «Location GEOLOCATED»: si la zona no es la
          provincia, relanza indicando la zona a mano (ej. «Asturias, Spain»).
        </p>
      )}

      {imp.estado !== "cargada" ? (
        imp.estado === "fallida" ? (
          <p className="mt-6 rounded-lg bg-error/10 px-4 py-3 text-sm text-error-dark">
            La búsqueda falló en Apify. Mira el log en el enlace de arriba y relánzala.
          </p>
        ) : (
          <Seguimiento id={imp.id} provincia={imp.provincia} inicio={imp.created_at} />
        )
      ) : (
        <Revision importacionId={imp.id} candidatos={candidatos ?? []} />
      )}
    </div>
  );
}
