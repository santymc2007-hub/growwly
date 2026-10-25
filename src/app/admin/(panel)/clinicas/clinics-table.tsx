"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { VerifiedBadge } from "@/components/clinics/verified-badge";
import { OrderControls } from "./order-controls";
import { DeleteClinicButton } from "./delete-button";
import { setPublicadoBatch, deleteClinicsBatch } from "./actions";
import type { Clinic } from "@/lib/supabase/database.types";
import { datosVerificacionCompletos } from "@/lib/clinica/verificacion";
import type { EstadoReclamo } from "@/lib/admin/email-reclamo";
import { BotonEmailReclamo } from "./boton-email-reclamo";

export type ClinicRow = Clinic & {
  isFirst: boolean;
  isLast: boolean;
  reclamo: { estado: EstadoReclamo; enviadoEn: string | null };
};

export function ClinicsTable({ rows }: { rows: ClinicRow[] }) {
  const [seleccionadas, setSeleccionadas] = useState<Set<string>>(new Set());
  const [pending, startTransition] = useTransition();

  function alternarUna(id: string) {
    setSeleccionadas((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function alternarTodas() {
    setSeleccionadas((prev) =>
      prev.size === rows.length ? new Set() : new Set(rows.map((r) => r.id)),
    );
  }

  function activar() {
    const ids = Array.from(seleccionadas);
    startTransition(async () => {
      await setPublicadoBatch(ids, true);
      setSeleccionadas(new Set());
    });
  }

  function desactivar() {
    const ids = Array.from(seleccionadas);
    startTransition(async () => {
      await setPublicadoBatch(ids, false);
      setSeleccionadas(new Set());
    });
  }

  function borrar() {
    const ids = Array.from(seleccionadas);
    if (
      !confirm(
        `¿Eliminar ${ids.length} ${ids.length === 1 ? "clínica" : "clínicas"}? Esta acción no se puede deshacer.`,
      )
    ) {
      return;
    }
    startTransition(async () => {
      await deleteClinicsBatch(ids);
      setSeleccionadas(new Set());
    });
  }

  return (
    // Sin overflow-hidden: la confirmación del email se despliega sobre la tabla.
    <div className="mt-6 rounded-2xl border border-line bg-white [&_thead_th:first-child]:rounded-tl-2xl [&_thead_th:last-child]:rounded-tr-2xl">
      {seleccionadas.size > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-cyan/10 px-4 py-2.5 text-sm">
          <span className="font-medium text-teal-dark">
            {seleccionadas.size} {seleccionadas.size === 1 ? "seleccionada" : "seleccionadas"}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={pending}
              onClick={activar}
              className="rounded-lg bg-white px-3 py-1.5 font-medium text-teal-dark shadow-sm hover:bg-paper-dim disabled:opacity-60"
            >
              Activar
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={desactivar}
              className="rounded-lg bg-white px-3 py-1.5 font-medium text-teal-dark shadow-sm hover:bg-paper-dim disabled:opacity-60"
            >
              Desactivar
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={borrar}
              className="rounded-lg bg-error/10 px-3 py-1.5 font-medium text-error-dark hover:bg-error/20 disabled:opacity-60"
            >
              Eliminar
            </button>
          </div>
        </div>
      )}

      <table className="w-full text-left text-sm">
        <thead className="bg-paper-dim text-ink-soft">
          <tr>
            <th className="px-4 py-3">
              <input
                type="checkbox"
                checked={rows.length > 0 && seleccionadas.size === rows.length}
                onChange={alternarTodas}
                aria-label="Seleccionar todas"
              />
            </th>
            <th className="px-4 py-3 font-medium">Orden</th>
            <th className="px-4 py-3 font-medium">Nombre</th>
            <th className="px-4 py-3 font-medium">Ciudad</th>
            <th className="px-4 py-3 font-medium">Estado</th>
            <th className="px-4 py-3 font-medium">Actualizado</th>
            <th className="px-4 py-3 font-medium text-right">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((clinic) => (
            <tr
              key={clinic.id}
              className={`border-t border-line ${
                !clinic.verificado_admin
                  ? "bg-orange/5"
                  : !clinic.publicado
                    ? "bg-error/5"
                    : ""
              }`}
            >
              <td className="px-4 py-3">
                <input
                  type="checkbox"
                  checked={seleccionadas.has(clinic.id)}
                  onChange={() => alternarUna(clinic.id)}
                  aria-label={`Seleccionar ${clinic.nombre}`}
                />
              </td>
              <td className="px-4 py-3">
                <OrderControls
                  id={clinic.id}
                  destacado={clinic.destacado}
                  isFirst={clinic.isFirst}
                  isLast={clinic.isLast}
                />
              </td>
              <td className="px-4 py-3 font-medium text-ink">{clinic.nombre}</td>
              <td className="px-4 py-3 text-ink-soft">{clinic.ciudad ?? "—"}</td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-1.5">
                  {!clinic.verificado_admin && (
                    <Link
                      href={`/admin/clinicas/${clinic.id}/editar`}
                      className="rounded-full bg-orange/20 px-2.5 py-1 text-xs font-medium text-orange hover:bg-orange/30"
                    >
                      ⚠ Sin verificar — no visible
                    </Link>
                  )}
                  {clinic.verificado ? (
                    <VerifiedBadge />
                  ) : datosVerificacionCompletos(clinic) ? (
                    <Link
                      href={`/admin/clinicas/${clinic.id}/editar`}
                      className="rounded-full bg-yellow/40 px-2.5 py-1 text-xs font-semibold text-ink hover:bg-yellow/60"
                    >
                      Pide verificación
                    </Link>
                  ) : (
                    <span className="rounded-full bg-paper-dim px-2.5 py-1 text-xs font-medium text-ink-soft">
                      Pendiente
                    </span>
                  )}
                  {!clinic.publicado && (
                    <span className="rounded-full bg-error/15 px-2.5 py-1 text-xs font-medium text-error-dark">
                      De baja
                    </span>
                  )}
                  {clinic.destacado_solicitado && (
                    <Link
                      href={`/admin/clinicas/${clinic.id}/editar`}
                      className="rounded-full bg-cyan/15 px-2.5 py-1 text-xs font-medium text-cyan-dark hover:bg-cyan/25"
                    >
                      ★ Solicita destacado
                    </Link>
                  )}
                  {clinic.destacado_provincia_solicitado && (
                    <Link
                      href={`/admin/clinicas/${clinic.id}/editar`}
                      className="rounded-full bg-cyan/15 px-2.5 py-1 text-xs font-medium text-cyan-dark hover:bg-cyan/25"
                    >
                      📍 Solicita provincia
                    </Link>
                  )}
                  {clinic.plan_solicitado && (
                    <Link
                      href={`/admin/clinicas/${clinic.id}/editar`}
                      className="rounded-full bg-cyan/15 px-2.5 py-1 text-xs font-medium text-cyan-dark hover:bg-cyan/25"
                    >
                      ✦ Solicita {clinic.plan_solicitado}
                    </Link>
                  )}
                </div>
              </td>
              <td className="px-4 py-3 text-ink-soft">
                {new Date(clinic.updated_at).toLocaleDateString("es-ES")}
              </td>
              <td className="px-4 py-3 text-right">
                <div className="flex items-center justify-end gap-3">
                  <BotonEmailReclamo
                    clinicId={clinic.id}
                    email={clinic.email}
                    estado={clinic.reclamo.estado}
                    enviadoEn={clinic.reclamo.enviadoEn}
                  />
                  <Link
                    href={`/admin/clinicas/${clinic.id}/editar`}
                    className="font-medium text-cyan hover:text-cyan-dark"
                  >
                    Editar
                  </Link>
                  <DeleteClinicButton id={clinic.id} nombre={clinic.nombre} />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 && (
        <p className="px-4 py-8 text-center text-sm text-ink-soft">
          Ninguna clínica coincide con estos filtros.
        </p>
      )}
    </div>
  );
}
