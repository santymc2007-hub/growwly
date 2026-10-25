import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { PROVINCIAS_ESPANA } from "@/lib/clinic-options";
import { BUSQUEDAS_CAPILARES } from "@/lib/importador/apify";
import { lanzarImportacion } from "./actions";

export const dynamic = "force-dynamic";

const inputClass =
  "mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-teal/30";

const ESTADOS: Record<string, string> = {
  en_curso: "Buscando en Apify",
  terminada: "Terminada",
  fallida: "Fallida",
  cargada: "Lista para revisar",
};

export default async function ImportarProvinciaPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const { data: importaciones } = await createAdminClient()
    .from("importaciones_provincia")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(30);

  return (
    <div className="max-w-[1200px]">
      <Link href="/admin/clinicas" className="text-sm font-medium text-cyan hover:text-cyan-dark">
        ← Volver al listado
      </Link>
      <h1 className="mt-4 font-display text-2xl text-teal-dark">Importar provincia</h1>
      <p className="mt-1 max-w-2xl text-sm text-ink-soft">
        Busca en Google Maps (vía Apify) todos los centros capilares de una provincia. Luego revisas la
        lista y cada centro se importa con el importador de siempre: ficha sin publicar.
      </p>

      {error && <p className="mt-4 rounded-lg bg-error/10 px-4 py-3 text-sm text-error-dark">{error}</p>}

      <form action={lanzarImportacion} className="mt-6 grid max-w-2xl gap-4 rounded-2xl border border-line bg-white p-5">
        <div>
          <label className="text-sm font-medium text-ink" htmlFor="provincia">
            Provincia
          </label>
          <select id="provincia" name="provincia" required defaultValue="" className={inputClass}>
            <option value="" disabled>
              Elige provincia…
            </option>
            {PROVINCIAS_ESPANA.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-ink" htmlFor="zona">
            Zona de búsqueda (opcional)
          </label>
          <input
            id="zona"
            name="zona"
            placeholder="Por defecto: «Provincia de [provincia], España». Ej. para afinar: «Gandia, Valencia, España»"
            className={inputClass}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-ink" htmlFor="max_por_busqueda">
              Máx. resultados por búsqueda
            </label>
            <input id="max_por_busqueda" name="max_por_busqueda" type="number" min={10} max={500} defaultValue={100} className={inputClass} />
          </div>
          <div>
            <label className="text-sm font-medium text-ink" htmlFor="max_gasto">
              Tope de gasto en Apify (USD)
            </label>
            <input id="max_gasto" name="max_gasto" type="number" min={1} max={100} defaultValue={15} className={inputClass} />
          </div>
        </div>
        <p className="text-xs text-ink-soft">
          {BUSQUEDAS_CAPILARES.length} búsquedas: {BUSQUEDAS_CAPILARES.join(" · ")}
        </p>
        <button className="press justify-self-start rounded-full bg-teal px-5 py-2 text-sm font-medium text-paper hover:bg-teal-dark">
          Lanzar búsqueda
        </button>
      </form>

      <h2 className="mt-10 font-display text-lg text-teal-dark">Importaciones</h2>
      {!importaciones?.length ? (
        <p className="mt-2 text-sm text-ink-soft">Todavía no hay ninguna.</p>
      ) : (
        <ul className="mt-3 divide-y divide-line rounded-2xl border border-line bg-white">
          {importaciones.map((i) => (
            <li key={i.id}>
              <Link href={`/admin/clinicas/importar-provincia/${i.id}`} className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 hover:bg-paper-dim">
                <span className="font-medium text-ink">
                  {i.provincia} <span className="font-normal text-ink-soft">· {i.zona_busqueda}</span>
                </span>
                <span className="text-sm text-ink-soft">
                  {ESTADOS[i.estado] ?? i.estado}
                  {i.total_resultados != null ? ` · ${i.total_resultados} resultados` : ""} ·{" "}
                  {new Date(i.created_at).toLocaleDateString("es-ES")}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
