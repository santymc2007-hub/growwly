"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Database } from "@/lib/supabase/database.types";
import { aplicarRevision, type ResultadoRevision } from "../actions";

type Candidato = Database["public"]["Tables"]["importacion_candidatos"]["Row"];
type Marca = "viable" | "eliminar";
type Pestana = "pendiente" | "importado" | "ya_en_growwly" | "descartado";
type Filtro = "todos" | "sin_marcar" | "viable" | "eliminar";

const PESTANAS: { estado: Pestana; etiqueta: string }[] = [
  { estado: "pendiente", etiqueta: "Pendientes" },
  { estado: "descartado", etiqueta: "Descartados" },
  { estado: "importado", etiqueta: "Importados" },
  { estado: "ya_en_growwly", etiqueta: "Ya en Growwly" },
];
const REVISABLES: Pestana[] = ["pendiente", "descartado"];

function leerMarcas(clave: string): Record<string, Marca> {
  try {
    const raw = localStorage.getItem(clave);
    return raw ? (JSON.parse(raw) as Record<string, Marca>) : {};
  } catch {
    return {};
  }
}

/**
 * Revisión sin recargar: se marca cada centro como "viable" o "eliminar"
 * (las marcas se guardan en este navegador por si cierras la pestaña) y
 * al final "Enviar" crea las fichas viables y borra las eliminadas.
 */
export function Revision({ importacionId, candidatos }: { importacionId: string; candidatos: Candidato[] }) {
  const router = useRouter();
  const clave = `growwly-revision-${importacionId}`;
  const [pestana, setPestana] = useState<Pestana>("pendiente");
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [marcas, setMarcas] = useState<Record<string, Marca>>({});
  const [resultado, setResultado] = useState<ResultadoRevision | null>(null);
  const [enviando, startEnvio] = useTransition();

  // Recupera las marcas guardadas (solo de centros que siguen revisables).
  useEffect(() => {
    const guardadas = leerMarcas(clave);
    const vigentes = new Set(candidatos.filter((c) => REVISABLES.includes(c.estado as Pestana)).map((c) => c.id));
    const limpias = Object.fromEntries(Object.entries(guardadas).filter(([id]) => vigentes.has(id)));
    // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage solo existe en el cliente
    setMarcas(limpias);
  }, [clave, candidatos]);

  useEffect(() => {
    try {
      localStorage.setItem(clave, JSON.stringify(marcas));
    } catch {
      /* navegación privada o almacenamiento bloqueado: se sigue sin guardar */
    }
  }, [clave, marcas]);

  const marcar = (id: string, m: Marca) =>
    setMarcas((prev) => {
      const next = { ...prev };
      if (next[id] === m) delete next[id];
      else next[id] = m;
      return next;
    });

  const cuenta = (e: Pestana) => candidatos.filter((c) => c.estado === e).length;
  const enPestana = useMemo(() => candidatos.filter((c) => c.estado === pestana), [candidatos, pestana]);
  const visibles = enPestana.filter((c) =>
    filtro === "todos" ? true : filtro === "sin_marcar" ? !marcas[c.id] : marcas[c.id] === filtro,
  );
  const revisable = REVISABLES.includes(pestana);
  const revisados = enPestana.filter((c) => marcas[c.id]).length;

  const viables = Object.entries(marcas).filter(([, m]) => m === "viable").map(([id]) => id);
  const eliminar = Object.entries(marcas).filter(([, m]) => m === "eliminar").map(([id]) => id);

  const enviar = () =>
    startEnvio(async () => {
      const r = await aplicarRevision(importacionId, viables, eliminar);
      setResultado(r);
      if (r.ok) {
        setMarcas({});
        router.refresh();
      }
    });

  return (
    <div className="pb-28">
      <nav className="mt-6 flex flex-wrap gap-2">
        {PESTANAS.map((p) => (
          <button
            key={p.estado}
            type="button"
            onClick={() => {
              setPestana(p.estado);
              setFiltro("todos");
            }}
            className={`press rounded-full px-4 py-1.5 text-sm font-medium ${
              p.estado === pestana ? "bg-teal text-paper" : "border border-line bg-white text-ink hover:bg-paper-dim"
            }`}
          >
            {p.etiqueta} ({cuenta(p.estado)})
          </button>
        ))}
      </nav>

      {revisable && enPestana.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
          <span className="text-ink-soft">
            Revisados {revisados} de {enPestana.length}
          </span>
          <span className="mx-1 text-line">|</span>
          {(
            [
              ["todos", "Todos"],
              ["sin_marcar", "Sin marcar"],
              ["viable", "Viables"],
              ["eliminar", "Eliminar"],
            ] as [Filtro, string][]
          ).map(([f, etiqueta]) => (
            <button
              key={f}
              type="button"
              onClick={() => setFiltro(f)}
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                filtro === f ? "bg-ink text-paper" : "border border-line bg-white text-ink hover:bg-paper-dim"
              }`}
            >
              {etiqueta}
            </button>
          ))}
        </div>
      )}

      {resultado && (
        <p
          className={`mt-4 rounded-lg px-4 py-3 text-sm ${
            resultado.ok ? "bg-green/10 text-ink" : "bg-error/10 text-error-dark"
          }`}
        >
          {resultado.ok
            ? `Hecho: ${resultado.creadas} fichas creadas (sin publicar, en «Importados») y ${resultado.eliminadas} eliminados.${
                resultado.avisos.length ? ` Avisos: ${resultado.avisos.join(" · ")}` : ""
              }`
            : resultado.error}
        </p>
      )}

      {!visibles.length ? (
        <p className="mt-4 text-sm text-ink-soft">Nada aquí.</p>
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
              {visibles.map((c) => {
                const m = marcas[c.id];
                const fila =
                  m === "viable" ? "bg-green/10" : m === "eliminar" ? "bg-error/5 text-ink-soft" : "";
                return (
                  <tr key={c.id} className={`align-top transition-colors ${fila}`}>
                    <td className="px-4 py-3">
                      <p className={`font-medium ${m === "eliminar" ? "line-through" : "text-ink"}`}>{c.nombre}</p>
                      <p className="text-xs text-ink-soft">{c.direccion}</p>
                      {c.motivo && <p className="mt-1 text-xs text-error-dark">{c.motivo}</p>}
                    </td>
                    <td className="px-4 py-3 text-ink-soft">{c.categoria}</td>
                    <td className="px-4 py-3 text-ink-soft">{c.municipio}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-ink-soft">
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
                      {revisable ? (
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => marcar(c.id, "viable")}
                            className={`press rounded-full px-3 py-1 text-xs font-medium ${
                              m === "viable"
                                ? "bg-green text-white"
                                : "border border-line text-ink hover:bg-green/10"
                            }`}
                          >
                            {m === "viable" ? "✓ Viable" : "Viable"}
                          </button>
                          <button
                            type="button"
                            onClick={() => marcar(c.id, "eliminar")}
                            className={`press rounded-full px-3 py-1 text-xs font-medium ${
                              m === "eliminar"
                                ? "bg-error text-white"
                                : "border border-line text-ink hover:bg-error/10"
                            }`}
                          >
                            {m === "eliminar" ? "✕ Eliminar" : "Eliminar"}
                          </button>
                        </div>
                      ) : (
                        c.clinic_id && (
                          <Link
                            href={`/admin/clinicas/importar?clinica=${c.clinic_id}`}
                            className="text-xs text-cyan hover:underline"
                          >
                            Completar desde su web
                          </Link>
                        )
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {(viables.length > 0 || eliminar.length > 0) && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 backdrop-blur">
          <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-3 px-4 py-3">
            <p className="text-sm text-ink">
              <span className="font-medium text-sage-ink">{viables.length} viables</span> se crearán como fichas sin
              publicar · <span className="font-medium text-error-dark">{eliminar.length} a eliminar</span>
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setMarcas({})}
                disabled={enviando}
                className="rounded-full border border-line px-4 py-2 text-sm text-ink hover:bg-paper-dim"
              >
                Quitar marcas
              </button>
              <button
                type="button"
                onClick={enviar}
                disabled={enviando}
                className="press rounded-full bg-teal px-5 py-2 text-sm font-medium text-paper hover:bg-teal-dark disabled:opacity-60"
              >
                {enviando ? "Enviando…" : "Enviar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
