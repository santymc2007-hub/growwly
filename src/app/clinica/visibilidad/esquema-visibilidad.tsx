/**
 * Esquema dibujado (sin imágenes) de dónde sale la clínica con cada
 * destacado: miniaturas de la portada y de /centros con su posición
 * resaltada. Si cambian las reglas de lib/visibilidad/tipos.ts, cambiar
 * también estos dibujos.
 */

function Pantalla({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <figure className="flex min-w-0 flex-1 flex-col">
      <div className="flex h-full flex-col overflow-hidden rounded-lg border border-line bg-white shadow-sm">
        <div className="flex items-center gap-1 border-b border-line bg-paper-dim px-2 py-1">
          <span className="h-1.5 w-1.5 rounded-full bg-line" />
          <span className="h-1.5 w-1.5 rounded-full bg-line" />
          <span className="h-1.5 w-1.5 rounded-full bg-line" />
          <span className="ml-1 truncate text-[9px] text-ink-soft">growwly.es{titulo}</span>
        </div>
        <div className="flex flex-1 flex-col gap-1.5 p-2">{children}</div>
      </div>
    </figure>
  );
}

/** Tarjeta pequeña de centro; `tu` = la de esta clínica, resaltada. */
function MiniTarjeta({ tu }: { tu?: boolean }) {
  return tu ? (
    <div className="relative rounded-md border-2 border-teal bg-yellow/40 p-1">
      <span className="absolute -top-1.5 left-1 rounded-full bg-teal px-1 text-[7px] font-bold leading-3 text-paper">
        Tú
      </span>
      <div className="h-3 rounded-sm bg-teal/30" />
      <div className="mt-0.5 h-1 w-2/3 rounded-full bg-teal/50" />
    </div>
  ) : (
    <div className="rounded-md border border-line p-1">
      <div className="h-3 rounded-sm bg-paper-dim" />
      <div className="mt-0.5 h-1 w-2/3 rounded-full bg-line" />
    </div>
  );
}

/** Fila de un listado; `destacado` lleva la etiqueta y `tu` se resalta. */
function Fila({ destacado, tu }: { destacado?: boolean; tu?: boolean }) {
  return (
    <div
      className={`flex items-center gap-1.5 rounded-md p-1 ${
        tu ? "border-2 border-teal bg-yellow/40" : destacado ? "border border-teal/30 bg-sage/40" : "border border-line"
      }`}
    >
      <div className={`h-4 w-4 shrink-0 rounded-sm ${tu ? "bg-teal/40" : "bg-paper-dim"}`} />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className={`h-1 w-3/4 rounded-full ${tu ? "bg-teal/60" : "bg-line"}`} />
        <div className="h-1 w-1/2 rounded-full bg-line" />
      </div>
      {destacado && (
        <span className="shrink-0 rounded-full bg-teal px-1 text-[7px] font-bold leading-3 text-paper">
          {tu ? "Tú" : "Destacado"}
        </span>
      )}
    </div>
  );
}

function Filtro({ texto, activo }: { texto: string; activo?: boolean }) {
  return (
    <span
      className={`rounded-full px-1.5 text-[8px] font-medium leading-4 ${
        activo ? "bg-teal text-paper" : "border border-line text-ink-soft"
      }`}
    >
      {texto}
    </span>
  );
}

export function EsquemaVisibilidad({
  tipo,
  provincia,
}: {
  tipo: "destacado" | "destacado_provincia";
  provincia?: string | null;
}) {
  if (tipo === "destacado") {
    return (
      <div className="flex gap-2">
        <Pantalla titulo="">
          <div className="h-1.5 w-1/2 rounded-full bg-line" />
          <div className="h-1 w-3/4 rounded-full bg-paper-dim" />
          <p className="mt-0.5 text-[8px] font-bold text-teal-dark">Centros destacados</p>
          <div className="grid grid-cols-4 gap-1">
            <MiniTarjeta />
            <MiniTarjeta tu />
            <MiniTarjeta />
            <MiniTarjeta />
            <MiniTarjeta />
            <MiniTarjeta />
            <MiniTarjeta />
            <MiniTarjeta />
          </div>
          <figcaption className="mt-auto pt-1 text-center text-[9px] text-ink-soft">Portada</figcaption>
        </Pantalla>
        <Pantalla titulo="/centros">
          <div className="flex flex-wrap gap-1">
            <Filtro texto="Toda España" activo />
          </div>
          <Fila destacado tu />
          <Fila destacado />
          <Fila />
          <Fila />
          <figcaption className="mt-auto pt-1 text-center text-[9px] text-ink-soft">Listado sin filtrar</figcaption>
        </Pantalla>
      </div>
    );
  }

  const zona = provincia || "Tu provincia";
  return (
    <div className="flex gap-2">
      <Pantalla titulo="/centros">
        <div className="flex flex-wrap gap-1">
          <Filtro texto={zona} activo />
          <Filtro texto="Injerto FUE" />
        </div>
        <Fila destacado tu />
        <Fila destacado />
        <Fila />
        <Fila />
        <figcaption className="mt-auto pt-1 text-center text-[9px] text-ink-soft">Búsqueda en {zona}</figcaption>
      </Pantalla>
      <Pantalla titulo="/centros/…/tu-ciudad">
        <div className="h-1.5 w-1/2 rounded-full bg-line" />
        <Fila destacado tu />
        <Fila />
        <Fila />
        <figcaption className="mt-auto pt-1 text-center text-[9px] text-ink-soft">Páginas de sus ciudades</figcaption>
      </Pantalla>
    </div>
  );
}
