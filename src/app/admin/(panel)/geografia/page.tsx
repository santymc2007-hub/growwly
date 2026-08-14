import { getMunicipiosYZonas } from "@/lib/clinica/geografia";
import { PROVINCIAS_ESPANA } from "@/lib/clinic-options";
import {
  anadirMunicipio,
  quitarMunicipio,
  anadirZona,
  quitarZona,
} from "./actions";

export const dynamic = "force-dynamic";

export default async function GeografiaPage() {
  const { municipios, zonas } = await getMunicipiosYZonas();

  const municipiosPorProvincia = new Map<string, string[]>();
  for (const m of municipios) {
    const lista = municipiosPorProvincia.get(m.provincia) ?? [];
    lista.push(m.nombre);
    municipiosPorProvincia.set(m.provincia, lista);
  }

  const zonasPorMunicipio = new Map<string, string[]>();
  for (const z of zonas) {
    const lista = zonasPorMunicipio.get(z.municipio) ?? [];
    lista.push(z.nombre);
    zonasPorMunicipio.set(z.municipio, lista);
  }
  const municipiosConNombre = municipios.map((m) => m.nombre).sort((a, b) => a.localeCompare(b, "es"));
  const municipiosUnicos = Array.from(new Set(municipiosConNombre));

  return (
    <div>
      <h1 className="font-display text-2xl text-teal-dark">Geografía</h1>
      <p className="mt-1 max-w-2xl text-sm text-ink-soft">
        Municipios y zonas/barrios que aparecen como desplegable en la
        ubicación de las fichas — nada de texto libre, para evitar
        duplicados y errores. Añade aquí cuando abras una provincia nueva.
      </p>

      {/* Municipios */}
      <section className="mt-8">
        <h2 className="font-display text-lg text-teal-dark">Municipios</h2>
        <form action={anadirMunicipio} className="mt-3 flex flex-wrap items-end gap-2">
          <div>
            <label className="text-xs font-medium text-ink-soft" htmlFor="provincia">
              Provincia
            </label>
            <select
              id="provincia"
              name="provincia"
              defaultValue="Illes Balears"
              className="mt-1 block rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink"
            >
              {PROVINCIAS_ESPANA.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-ink-soft" htmlFor="nombre-municipio">
              Nombre del municipio
            </label>
            <input
              id="nombre-municipio"
              name="nombre"
              placeholder="Ej. Sevilla"
              className="mt-1 block rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink"
            />
          </div>
          <button
            type="submit"
            className="rounded-full bg-teal px-4 py-2 text-sm font-medium text-paper hover:bg-teal-dark"
          >
            Añadir municipio
          </button>
        </form>

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from(municipiosPorProvincia.entries()).map(([provincia, nombres]) => (
            <div key={provincia} className="rounded-xl border border-line bg-white p-4">
              <p className="font-medium text-ink">
                {provincia}{" "}
                <span className="text-xs font-normal text-ink-soft">
                  ({nombres.length})
                </span>
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {nombres.sort((a, b) => a.localeCompare(b, "es")).map((n) => {
                  const quitar = quitarMunicipio.bind(null, provincia, n);
                  return (
                    <form key={n} action={quitar}>
                      <button
                        type="submit"
                        title="Quitar"
                        className="rounded-full bg-sage px-2.5 py-1 text-xs text-sage-ink hover:bg-error/10 hover:text-error"
                      >
                        {n} ✕
                      </button>
                    </form>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Zonas */}
      <section className="mt-12">
        <h2 className="font-display text-lg text-teal-dark">Zonas / barrios</h2>
        <p className="mt-1 text-sm text-ink-soft">
          Solo tiene sentido en ciudades grandes (hoy, Palma) — los pueblos
          pequeños se dejan sin zonas y ese campo queda opcional en el
          formulario.
        </p>
        <form action={anadirZona} className="mt-3 flex flex-wrap items-end gap-2">
          <div>
            <label className="text-xs font-medium text-ink-soft" htmlFor="municipio">
              Municipio
            </label>
            <select
              id="municipio"
              name="municipio"
              defaultValue="Palma"
              className="mt-1 block rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink"
            >
              {municipiosUnicos.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-ink-soft" htmlFor="nombre-zona">
              Nombre de la zona
            </label>
            <input
              id="nombre-zona"
              name="nombre"
              placeholder="Ej. Camp Redó"
              className="mt-1 block rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink"
            />
          </div>
          <button
            type="submit"
            className="rounded-full bg-teal px-4 py-2 text-sm font-medium text-paper hover:bg-teal-dark"
          >
            Añadir zona
          </button>
        </form>

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from(zonasPorMunicipio.entries()).map(([municipio, nombres]) => (
            <div key={municipio} className="rounded-xl border border-line bg-white p-4">
              <p className="font-medium text-ink">
                {municipio}{" "}
                <span className="text-xs font-normal text-ink-soft">
                  ({nombres.length})
                </span>
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {nombres.sort((a, b) => a.localeCompare(b, "es")).map((n) => {
                  const quitar = quitarZona.bind(null, municipio, n);
                  return (
                    <form key={n} action={quitar}>
                      <button
                        type="submit"
                        title="Quitar"
                        className="rounded-full bg-sage px-2.5 py-1 text-xs text-sage-ink hover:bg-error/10 hover:text-error"
                      >
                        {n} ✕
                      </button>
                    </form>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
