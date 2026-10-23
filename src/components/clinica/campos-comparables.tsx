"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import {
  CATEGORIAS_VENTAJA,
  FINANCIACION_OPCIONES,
  PARKING_OPCIONES,
  QUIEN_OPERA_OPCIONES,
  REVISIONES_OPCIONES,
  SEGUIMIENTO_OPCIONES,
} from "@/lib/clinica/comparables";

export type VentajaOpcion = { id: string; nombre: string; categoria: string };
export type PropuestaPendiente = { id: string; nombre: string };

export type ValoresComparables = {
  financiacion_tipo: string | null;
  parking: string | null;
  quien_opera: string | null;
  revisiones_num: number | null;
  seguimiento_meses: number | null;
  garantia: boolean | null;
  garantia_condiciones: string | null;
  max_uf_sesion: number | null;
  anios_experiencia: number | null;
  injertos_anio: number | null;
};

const inputClass =
  "mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-teal/30";
const labelClass = "text-sm font-medium text-ink";
const chipClass =
  "flex cursor-pointer items-center gap-1.5 rounded-full border border-line bg-white px-3 py-1.5 text-sm has-[:checked]:border-teal has-[:checked]:bg-sage/40";

function Selector({
  name,
  etiqueta,
  ayuda,
  valor,
  opciones,
}: {
  name: string;
  etiqueta: string;
  ayuda?: string;
  valor: string | number | null;
  opciones: readonly { valor: string | number; etiqueta: string }[];
}) {
  return (
    <div>
      <label htmlFor={name} className={labelClass}>
        {etiqueta}
      </label>
      {ayuda && <p className="mt-0.5 text-xs text-ink-soft">{ayuda}</p>}
      <select id={name} name={name} defaultValue={valor ?? ""} className={inputClass}>
        <option value="">Sin indicar</option>
        {opciones.map((o) => (
          <option key={o.valor} value={o.valor}>
            {o.etiqueta}
          </option>
        ))}
      </select>
    </div>
  );
}

function Numero({
  name,
  etiqueta,
  valor,
  placeholder,
}: {
  name: string;
  etiqueta: string;
  valor: number | null;
  placeholder?: string;
}) {
  return (
    <div>
      <label htmlFor={name} className={labelClass}>
        {etiqueta}
      </label>
      <input
        id={name}
        name={name}
        inputMode="numeric"
        defaultValue={valor ?? ""}
        placeholder={placeholder}
        className={inputClass}
      />
    </div>
  );
}

/**
 * Lo que el buscador con IA compara entre clínicas: opciones cerradas
 * (para que todas sean comparables), valores añadidos sí/sin indicar y
 * la propuesta de valores nuevos, que revisa el admin antes de
 * ofrecerlos a todas las clínicas.
 */
export function CamposComparables({
  valores,
  ventajas,
  seleccionadas,
  propuestas,
  permitirPropuestas = true,
}: {
  valores: ValoresComparables;
  ventajas: VentajaOpcion[];
  seleccionadas: string[];
  propuestas: PropuestaPendiente[];
  /** En el admin no: los valores nuevos se crean en /admin/valores. */
  permitirPropuestas?: boolean;
}) {
  const [nuevas, setNuevas] = useState<string[]>([]);
  const [borrador, setBorrador] = useState("");

  function proponer() {
    const t = borrador.trim().slice(0, 80);
    if (!t || nuevas.some((n) => n.toLowerCase() === t.toLowerCase())) return;
    setNuevas((ns) => [...ns, t].slice(0, 5));
    setBorrador("");
  }

  return (
    <div className="grid gap-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <Selector
          name="financiacion_tipo"
          etiqueta="Financiación"
          valor={valores.financiacion_tipo}
          opciones={FINANCIACION_OPCIONES}
        />
        <Selector
          name="parking"
          etiqueta="Parking"
          valor={valores.parking}
          opciones={PARKING_OPCIONES}
        />
        <Selector
          name="quien_opera"
          etiqueta="¿Quién hace el injerto?"
          valor={valores.quien_opera}
          opciones={QUIEN_OPERA_OPCIONES}
        />
        <Numero
          name="max_uf_sesion"
          etiqueta="Máx. unidades foliculares por sesión"
          valor={valores.max_uf_sesion}
          placeholder="Ej.: 4000"
        />
        <Selector
          name="revisiones_num"
          etiqueta="Revisiones incluidas"
          valor={valores.revisiones_num}
          opciones={REVISIONES_OPCIONES.map((n) => ({
            valor: n,
            etiqueta: n === 5 ? "5 o más" : String(n),
          }))}
        />
        <Selector
          name="seguimiento_meses"
          etiqueta="Seguimiento durante"
          valor={valores.seguimiento_meses}
          opciones={SEGUIMIENTO_OPCIONES.map((n) => ({ valor: n, etiqueta: `${n} meses` }))}
        />
        <Numero
          name="anios_experiencia"
          etiqueta="Años de experiencia"
          valor={valores.anios_experiencia}
        />
        <Numero
          name="injertos_anio"
          etiqueta="Injertos al año (aprox.)"
          valor={valores.injertos_anio}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-[200px_minmax(0,1fr)]">
        <Selector
          name="garantia"
          etiqueta="Garantía de resultado"
          valor={valores.garantia === null ? null : valores.garantia ? "si" : "no"}
          opciones={[
            { valor: "si", etiqueta: "Sí" },
            { valor: "no", etiqueta: "No" },
          ]}
        />
        <div>
          <label htmlFor="garantia_condiciones" className={labelClass}>
            Condiciones de la garantía
          </label>
          <input
            id="garantia_condiciones"
            name="garantia_condiciones"
            maxLength={200}
            defaultValue={valores.garantia_condiciones ?? ""}
            placeholder="Ej.: repetimos sin coste si no prende el 90 % de los injertos"
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <p className={labelClass}>Qué más ofrecéis</p>
        <p className="mt-0.5 text-xs text-ink-soft">
          Marca solo lo que ofrecéis. Lo que marques sale en tu ficha y en el buscador de Growwly.
        </p>
        {CATEGORIAS_VENTAJA.map((cat) => {
          const deCat = ventajas.filter((v) => v.categoria === cat.valor);
          if (!deCat.length) return null;
          return (
            <div key={cat.valor} className="mt-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft/70">
                {cat.etiqueta}
              </p>
              <div className="mt-1.5 flex flex-wrap gap-2">
                {deCat.map((v) => (
                  <label key={v.id} className={chipClass}>
                    <input
                      type="checkbox"
                      name="ventajas"
                      value={v.id}
                      defaultChecked={seleccionadas.includes(v.id)}
                      className="accent-teal-dark"
                    />
                    {v.nombre}
                  </label>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {permitirPropuestas && (
      <div className="rounded-xl bg-paper-dim/60 p-4">
        <label htmlFor="propuesta_ventaja" className={labelClass}>
          ¿Ofrecéis algo que no está en la lista?
        </label>
        <p className="mt-0.5 text-xs text-ink-soft">
          Propónlo y lo revisamos. Si lo aprobamos, aparecerá en tu ficha y el resto de clínicas
          podrá marcarlo también.
        </p>
        <div className="mt-2 flex gap-2">
          <input
            id="propuesta_ventaja"
            value={borrador}
            onChange={(e) => setBorrador(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                proponer();
              }
            }}
            maxLength={80}
            placeholder="Ej.: Recogida en coche privado"
            className={`${inputClass} mt-0`}
          />
          <button
            type="button"
            onClick={proponer}
            className="press inline-flex shrink-0 items-center gap-1 rounded-lg bg-teal px-3 text-sm font-medium text-paper hover:bg-teal-dark"
          >
            <Plus className="h-4 w-4" aria-hidden />
            Proponer
          </button>
        </div>
        {(propuestas.length > 0 || nuevas.length > 0) && (
          <ul className="mt-3 flex flex-wrap gap-2">
            {propuestas.map((p) => (
              <li
                key={p.id}
                className="rounded-full border border-dashed border-line bg-white px-3 py-1 text-xs text-ink-soft"
              >
                {p.nombre} · pendiente de revisión
              </li>
            ))}
            {nuevas.map((n) => (
              <li
                key={n}
                className="flex items-center gap-1 rounded-full border border-dashed border-teal/40 bg-white px-3 py-1 text-xs text-teal-dark"
              >
                <input type="hidden" name="ventajas_propuestas" value={n} />
                {n} · se enviará al guardar
                <button
                  type="button"
                  onClick={() => setNuevas((ns) => ns.filter((x) => x !== n))}
                  aria-label={`Quitar ${n}`}
                  className="ml-1 font-bold text-ink-soft hover:text-red-700"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      )}
    </div>
  );
}
