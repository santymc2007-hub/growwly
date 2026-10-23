"use client";

import { useState } from "react";
import { Eye, EyeOff, Plus, Trash2 } from "lucide-react";
import {
  MAX_FILAS_PRECIO,
  MODALIDADES_PRECIO,
  TRAMOS_NORWOOD,
  type FilaPrecio,
  type Modalidad,
  type TramoNorwood,
} from "@/lib/clinica/comparables";

type Fila = FilaPrecio & { clave: number };

const inputClass =
  "w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-teal/30";

/** Campo de euros: solo dígitos, vacío = sin precio. */
function CampoEuros({
  valor,
  onChange,
  etiqueta,
}: {
  valor: number | null;
  onChange: (v: number | null) => void;
  etiqueta: string;
}) {
  return (
    <label className="block text-xs text-ink-soft">
      {etiqueta}
      <span className="relative mt-1 block">
        <input
          inputMode="numeric"
          value={valor ?? ""}
          onChange={(e) => {
            const limpio = e.target.value.replace(/[^\d]/g, "");
            onChange(limpio === "" ? null : Number(limpio));
          }}
          className={`${inputClass} pr-7`}
        />
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-ink-soft">
          €
        </span>
      </span>
    </label>
  );
}

/**
 * Tratamientos y precios de la clínica: una fila por tratamiento, con
 * precio opcional, varias formas de cobrar (total, sesión, bono, por
 * unidad folicular o por grado Norwood) y la opción de no enseñar el
 * precio al paciente. Se envía como JSON en `precios_json`.
 */
export function EditorPrecios({
  iniciales,
  sugerencias,
}: {
  iniciales: FilaPrecio[];
  /** Tratamientos del catálogo de Growwly, para autocompletar. */
  sugerencias: string[];
}) {
  const [filas, setFilas] = useState<Fila[]>(() =>
    iniciales.map((f, i) => ({ ...f, clave: i })),
  );
  const [siguiente, setSiguiente] = useState(iniciales.length);

  function cambiar(clave: number, cambios: Partial<FilaPrecio>) {
    setFilas((fs) => fs.map((f) => (f.clave === clave ? { ...f, ...cambios } : f)));
  }

  function cambiarTramo(
    fila: Fila,
    tramo: TramoNorwood,
    campo: "desde" | "hasta",
    valor: number | null,
  ) {
    const actual = fila.norwood?.[tramo] ?? { desde: null, hasta: null };
    cambiar(fila.clave, {
      norwood: { ...(fila.norwood ?? {}), [tramo]: { ...actual, [campo]: valor } },
    });
  }

  function anadir() {
    setFilas((fs) => [
      ...fs,
      {
        clave: siguiente,
        tratamiento: "",
        modalidad: "total",
        desde: null,
        hasta: null,
        norwood: null,
        nota: null,
        visible: true,
      },
    ]);
    setSiguiente((n) => n + 1);
  }

  const json = JSON.stringify(
    filas
      .filter((f) => f.tratamiento.trim() !== "")
      .map((f) => ({
        tratamiento: f.tratamiento,
        modalidad: f.modalidad,
        desde: f.desde,
        hasta: f.hasta,
        norwood: f.norwood,
        nota: f.nota,
        visible: f.visible,
      })),
  );

  return (
    <div>
      <input type="hidden" name="precios_json" value={json} />
      <datalist id="tratamientos-sugeridos">
        {sugerencias.map((s) => (
          <option key={s} value={s} />
        ))}
      </datalist>

      {filas.length === 0 && (
        <p className="mt-2 rounded-lg border border-dashed border-line px-3 py-4 text-center text-sm text-ink-soft">
          Aún no has añadido ningún tratamiento.
        </p>
      )}

      <div className="mt-2 flex flex-col gap-3">
        {filas.map((f) => (
          <div key={f.clave} className="rounded-xl border border-line bg-paper-dim/40 p-3">
            <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_200px_auto]">
              <label className="block text-xs text-ink-soft">
                Tratamiento
                <input
                  list="tratamientos-sugeridos"
                  value={f.tratamiento}
                  onChange={(e) => cambiar(f.clave, { tratamiento: e.target.value })}
                  placeholder="Ej.: Injerto capilar FUE"
                  maxLength={120}
                  className={`${inputClass} mt-1`}
                />
              </label>
              <label className="block text-xs text-ink-soft">
                Cómo cobráis
                <select
                  value={f.modalidad}
                  onChange={(e) =>
                    cambiar(f.clave, { modalidad: e.target.value as Modalidad })
                  }
                  className={`${inputClass} mt-1`}
                >
                  {MODALIDADES_PRECIO.map((m) => (
                    <option key={m.valor} value={m.valor}>
                      {m.etiqueta}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                onClick={() => setFilas((fs) => fs.filter((x) => x.clave !== f.clave))}
                aria-label={`Quitar ${f.tratamiento || "tratamiento"}`}
                className="flex h-10 w-10 items-center justify-center self-end rounded-lg text-ink-soft hover:bg-white hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" aria-hidden />
              </button>
            </div>

            {f.modalidad === "norwood" ? (
              <div className="mt-2 grid gap-2 sm:grid-cols-3">
                {TRAMOS_NORWOOD.map((t) => (
                  <div key={t} className="rounded-lg bg-white p-2">
                    <p className="text-xs font-semibold text-teal-dark">Norwood {t}</p>
                    <div className="mt-1 grid grid-cols-2 gap-2">
                      <CampoEuros
                        etiqueta="Desde"
                        valor={f.norwood?.[t]?.desde ?? null}
                        onChange={(v) => cambiarTramo(f, t, "desde", v)}
                      />
                      <CampoEuros
                        etiqueta="Hasta"
                        valor={f.norwood?.[t]?.hasta ?? null}
                        onChange={(v) => cambiarTramo(f, t, "hasta", v)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-2 grid grid-cols-2 gap-2 sm:max-w-sm">
                <CampoEuros
                  etiqueta="Desde"
                  valor={f.desde}
                  onChange={(v) => cambiar(f.clave, { desde: v })}
                />
                <CampoEuros
                  etiqueta="Hasta"
                  valor={f.hasta}
                  onChange={(v) => cambiar(f.clave, { hasta: v })}
                />
              </div>
            )}

            <div className="mt-2 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
              <label className="block text-xs text-ink-soft">
                Nota (opcional)
                <input
                  value={f.nota ?? ""}
                  onChange={(e) => cambiar(f.clave, { nota: e.target.value || null })}
                  placeholder="Ej.: incluye analítica y primera revisión"
                  maxLength={200}
                  className={`${inputClass} mt-1`}
                />
              </label>
              <label className="flex min-h-10 cursor-pointer items-center gap-2 rounded-lg px-2 text-sm text-ink">
                <input
                  type="checkbox"
                  checked={f.visible}
                  onChange={(e) => cambiar(f.clave, { visible: e.target.checked })}
                  className="accent-teal-dark"
                />
                {f.visible ? (
                  <Eye className="h-4 w-4 text-teal-dark" aria-hidden />
                ) : (
                  <EyeOff className="h-4 w-4 text-ink-soft" aria-hidden />
                )}
                Precio visible en mi ficha
              </label>
            </div>
          </div>
        ))}
      </div>

      {filas.length < MAX_FILAS_PRECIO && (
        <button
          type="button"
          onClick={anadir}
          className="press mt-3 inline-flex items-center gap-1.5 rounded-full border border-teal/40 bg-white px-4 py-2 text-sm font-medium text-teal-dark hover:bg-sage/30"
        >
          <Plus className="h-4 w-4" aria-hidden />
          Añadir tratamiento
        </button>
      )}
    </div>
  );
}
