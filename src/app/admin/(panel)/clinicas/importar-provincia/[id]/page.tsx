import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { cambiarEstadoCandidato } from "../actions";
import { Seguimiento } from "./seguimiento";

export const dynamic = "force-dynamic";
// Descargar y guardar cientos de resultados de Apify puede tardar.
export const maxDuration = 60;

const PESTANAS = [
  { estado: "pendiente", etiqueta: "Pendientes" },
  { estado: "importado", etiqueta: "Importados" },
  { estado: "ya_en_growwly", etiqueta: "Ya en Growwly" },
  { estado: "descartado", etiqueta: "Descartados" },
] as const;

export default async function ImportacionPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; estado?: string }>;
}) {
  const { id } = await params;
  const { error, estado: estadoParam } = await searchParams;
  const estado = PESTANAS.some((p) => p.estado === estadoParam) ? estadoParam! : "pendiente";
  const supabase = createAdminClient();

  const { data: imp } = await supabase.from("importaciones_provincia").select("*").eq("id", id).maybeSingle();
  if (!imp) notFound();

  const [{ data: candidatos }, { data: todos }] = await Promise.all([
    supabase
      .from("importacion_candidatos")
      .select("*")
      .eq("importacion_id", id)
      .eq("estado", estado)
      .order("municipio")
      .order("nombre"),
    supabase.from("importacion_candidatos").select("estado").eq("importacion_id", id),
  ]);
  const cuenta = (e: string) => (todos ?? []).filter((c) => c.estado === e).length;
  const base = `/admin/clinicas/importar-provincia/${id}`;

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
        <>
          <nav className="mt-6 flex flex-wrap gap-2">
            {PESTANAS.map((p) => (
              <Link
                key={p.estado}
                href={`${base}?estado=${p.estado}`}
                className={`rounded-full px-4 py-1.5 text-sm font-medium ${
                  p.estado === estado ? "bg-teal text-paper" : "border border-line bg-white text-ink hover:bg-paper-dim"
                }`}
              >
                {p.etiqueta} ({cuenta(p.estado)})
              </Link>
            ))}
          </nav>

          {!candidatos?.length ? (
            <p className="mt-4 text-sm text-ink-soft">Nada en esta pestaña.</p>
          ) : (
            <div className="mt-4 overflow-x-auto rounded-2xl border border-line bg-white">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-line bg-paper-dim text-xs uppercase text-ink-soft">
                  <tr>
                    <th className="px-4 py-2">Centro</th>
                    <th className="px-4 py-2">Categoría</th>
                    <th className="px-4 py-2">Municipio</th>
                    <th className="px-4 py-2">Google</th>
                    <th className="px-4 py-2">Web</th>
                    <th className="px-4 py-2" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {candidatos.map((c) => {
                    const importar = new URLSearchParams({
                      candidato: c.id,
                      nombre: c.nombre,
                      ...(c.web ? { web: c.web } : {}),
                      ...(c.maps_url ? { maps: c.maps_url } : {}),
                    });
                    return (
                      <tr key={c.id} className="align-top">
                        <td className="px-4 py-3">
                          <p className="font-medium text-ink">{c.nombre}</p>
                          <p className="text-xs text-ink-soft">{c.direccion}</p>
                          {c.motivo && <p className="mt-1 text-xs text-error-dark">{c.motivo}</p>}
                        </td>
                        <td className="px-4 py-3 text-ink-soft">{c.categoria}</td>
                        <td className="px-4 py-3 text-ink-soft">{c.municipio}</td>
                        <td className="px-4 py-3 text-ink-soft">
                          {c.rating != null ? `${c.rating} (${c.resenas ?? 0})` : "—"}
                          {c.maps_url && (
                            <a href={c.maps_url} target="_blank" rel="noopener" className="ml-1 text-cyan hover:underline">
                              ver
                            </a>
                          )}
                        </td>
                        <td className="max-w-[220px] truncate px-4 py-3">
                          {c.web ? (
                            <a href={c.web} target="_blank" rel="noopener" className="text-cyan hover:underline">
                              {c.web.replace(/^https?:\/\/(www\.)?/, "")}
                            </a>
                          ) : (
                            <span className="text-ink-soft">sin web</span>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-right">
                          {c.estado === "pendiente" && (
                            <div className="flex justify-end gap-2">
                              <Link
                                href={`/admin/clinicas/importar?${importar}`}
                                className="rounded-full bg-teal px-3 py-1 text-xs font-medium text-paper hover:bg-teal-dark"
                              >
                                Importar
                              </Link>
                              <form action={cambiarEstadoCandidato}>
                                <input type="hidden" name="id" value={c.id} />
                                <input type="hidden" name="importacion_id" value={id} />
                                <input type="hidden" name="estado" value="descartado" />
                                <button className="rounded-full border border-line px-3 py-1 text-xs text-ink hover:bg-paper-dim">
                                  Descartar
                                </button>
                              </form>
                            </div>
                          )}
                          {c.estado === "descartado" && (
                            <form action={cambiarEstadoCandidato}>
                              <input type="hidden" name="id" value={c.id} />
                              <input type="hidden" name="importacion_id" value={id} />
                              <input type="hidden" name="estado" value="pendiente" />
                              <button className="rounded-full border border-line px-3 py-1 text-xs text-ink hover:bg-paper-dim">
                                Recuperar
                              </button>
                            </form>
                          )}
                          {c.clinic_id && (
                            <Link href={`/admin/clinicas/${c.clinic_id}/editar`} className="text-xs text-cyan hover:underline">
                              Ver ficha
                            </Link>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
