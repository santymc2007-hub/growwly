import { createAdminClient } from "@/lib/supabase/admin";
import { CATEGORIAS_VENTAJA } from "@/lib/clinica/comparables";
import { crearValor, fusionarValor, guardarValor } from "./actions";

export const metadata = { title: "Valores añadidos · Admin" };

type SearchParams = { ok?: string; error?: string };

const input =
  "rounded-lg border border-line bg-white px-2.5 py-1.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-teal/30";

function SelectCategoria({ valor }: { valor: string }) {
  return (
    <select name="categoria" defaultValue={valor} className={input} aria-label="Categoría">
      {CATEGORIAS_VENTAJA.map((c) => (
        <option key={c.valor} value={c.valor}>
          {c.etiqueta}
        </option>
      ))}
    </select>
  );
}

export default async function AdminValoresPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { ok, error } = await searchParams;
  const admin = createAdminClient();
  const [{ data: ventajas }, { data: marcas }, { data: clinicas }] = await Promise.all([
    admin
      .from("ventajas")
      .select("id, nombre, categoria, destacada, estado, propuesta_por, orden, created_at")
      .order("orden")
      .order("nombre"),
    admin.from("clinic_ventajas").select("ventaja_id"),
    admin.from("clinics").select("id, nombre"),
  ]);

  const usos = new Map<string, number>();
  for (const m of marcas ?? []) usos.set(m.ventaja_id, (usos.get(m.ventaja_id) ?? 0) + 1);
  const nombreClinica = new Map((clinicas ?? []).map((c) => [c.id, c.nombre]));

  const lista = ventajas ?? [];
  const propuestas = lista.filter((v) => v.estado === "propuesta");
  const aprobadas = lista.filter((v) => v.estado === "aprobada");
  const archivadas = lista.filter((v) => v.estado === "archivada");

  return (
    <div>
      <h1 className="font-display text-2xl text-teal-dark">Valores añadidos</h1>
      <p className="mt-1 max-w-2xl text-sm text-ink-soft">
        Lo que las clínicas pueden marcar en su ficha (habitación privada, parking cercano…). Sale
        en la ficha pública y lo usa el buscador con IA. Los marcados como{" "}
        <strong>destacados</strong> aparecen como palabras sugeridas en el buscador.
      </p>

      {ok && <p className="mt-4 rounded-lg bg-sage/40 px-4 py-3 text-sm text-teal-dark">{ok}</p>}
      {error && <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      <section className="mt-6 rounded-2xl border border-line bg-white p-5">
        <h2 className="font-display text-lg text-teal-dark">
          Propuestas de clínicas{" "}
          <span className="text-sm font-normal text-ink-soft">({propuestas.length})</span>
        </h2>
        {propuestas.length === 0 ? (
          <p className="mt-2 text-sm text-ink-soft">No hay propuestas pendientes.</p>
        ) : (
          <ul className="mt-3 flex flex-col gap-3">
            {propuestas.map((v) => (
              <li key={v.id} className="rounded-xl border border-line p-3">
                <p className="text-xs text-ink-soft">
                  Propuesta por{" "}
                  <strong>{(v.propuesta_por && nombreClinica.get(v.propuesta_por)) ?? "—"}</strong>
                </p>
                <form action={guardarValor} className="mt-2 flex flex-wrap items-center gap-2">
                  <input type="hidden" name="id" value={v.id} />
                  <input name="nombre" defaultValue={v.nombre} className={`${input} min-w-[260px] flex-1`} aria-label="Nombre" />
                  <SelectCategoria valor={v.categoria} />
                  <label className="flex items-center gap-1.5 text-sm">
                    <input type="checkbox" name="destacada" defaultChecked={v.destacada} />
                    Destacado
                  </label>
                  <button name="estado" value="aprobada" className="rounded-lg bg-teal px-3 py-1.5 text-sm font-medium text-paper hover:bg-teal-dark">
                    Aprobar
                  </button>
                  <button name="estado" value="descartada" className="rounded-lg border border-line px-3 py-1.5 text-sm text-ink hover:border-ink/40">
                    Descartar
                  </button>
                </form>
                {aprobadas.length > 0 && (
                  <form action={fusionarValor} className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                    <input type="hidden" name="id" value={v.id} />
                    <span className="text-ink-soft">o es lo mismo que</span>
                    <select name="destino" className={input} aria-label="Valor existente" defaultValue="">
                      <option value="" disabled>
                        Elige uno existente…
                      </option>
                      {aprobadas.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.nombre}
                        </option>
                      ))}
                    </select>
                    <button className="rounded-lg border border-line px-3 py-1.5 text-sm text-ink hover:border-ink/40">
                      Fusionar
                    </button>
                  </form>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-6 rounded-2xl border border-line bg-white p-5">
        <h2 className="font-display text-lg text-teal-dark">Añadir un valor</h2>
        <form action={crearValor} className="mt-3 flex flex-wrap items-center gap-2">
          <input name="nombre" placeholder="Ej.: Recogida en coche privado" className={`${input} min-w-[260px] flex-1`} aria-label="Nombre" required />
          <SelectCategoria valor="otros" />
          <label className="flex items-center gap-1.5 text-sm">
            <input type="checkbox" name="destacada" />
            Destacado
          </label>
          <button className="rounded-lg bg-teal px-3 py-1.5 text-sm font-medium text-paper hover:bg-teal-dark">
            Añadir
          </button>
        </form>
      </section>

      <section className="mt-6 rounded-2xl border border-line bg-white p-5">
        <h2 className="font-display text-lg text-teal-dark">
          Activos <span className="text-sm font-normal text-ink-soft">({aprobadas.length})</span>
        </h2>
        {CATEGORIAS_VENTAJA.map((cat) => {
          const deCat = aprobadas.filter((v) => v.categoria === cat.valor);
          if (!deCat.length) return null;
          return (
            <div key={cat.valor} className="mt-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft/70">{cat.etiqueta}</p>
              <ul className="mt-1 divide-y divide-line">
                {deCat.map((v) => (
                  <li key={v.id}>
                    <form action={guardarValor} className="flex flex-wrap items-center gap-2 py-2">
                      <input type="hidden" name="id" value={v.id} />
                      <input name="nombre" defaultValue={v.nombre} className={`${input} min-w-[240px] flex-1`} aria-label="Nombre" />
                      <SelectCategoria valor={v.categoria} />
                      <label className="flex items-center gap-1.5 text-sm">
                        <input type="checkbox" name="destacada" defaultChecked={v.destacada} />
                        Destacado
                      </label>
                      <span className="w-24 text-right text-xs text-ink-soft">
                        {usos.get(v.id) ?? 0} {(usos.get(v.id) ?? 0) === 1 ? "clínica" : "clínicas"}
                      </span>
                      <button name="estado" value="aprobada" className="rounded-lg border border-line px-3 py-1.5 text-sm text-ink hover:border-ink/40">
                        Guardar
                      </button>
                      <button name="estado" value="archivada" className="rounded-lg px-2 py-1.5 text-sm text-ink-soft hover:text-red-700">
                        Archivar
                      </button>
                    </form>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </section>

      {archivadas.length > 0 && (
        <section className="mt-6 rounded-2xl border border-line bg-white p-5">
          <h2 className="font-display text-lg text-teal-dark">Archivados</h2>
          <ul className="mt-2 flex flex-wrap gap-2">
            {archivadas.map((v) => (
              <li key={v.id}>
                <form action={guardarValor} className="flex items-center gap-1 rounded-full border border-line px-3 py-1 text-sm">
                  <input type="hidden" name="id" value={v.id} />
                  <input type="hidden" name="nombre" value={v.nombre} />
                  <input type="hidden" name="categoria" value={v.categoria} />
                  {v.nombre}
                  <button name="estado" value="aprobada" className="ml-1 text-xs font-semibold text-cyan-dark hover:underline">
                    Recuperar
                  </button>
                </form>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
