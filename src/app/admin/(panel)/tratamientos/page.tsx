import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { DeleteTratamientoButton } from "./delete-button";

export default async function AdminTratamientosPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("tratamientos")
    .select("*")
    .order("nombre", { ascending: true });
  const tratamientos = data ?? [];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl text-teal-dark">
            Tratamientos
          </h1>
          <p className="mt-1 text-sm text-ink-soft">
            {tratamientos.length}{" "}
            {tratamientos.length === 1 ? "tratamiento" : "tratamientos"}
          </p>
        </div>
        <Link
          href="/admin/tratamientos/nuevo"
          className="rounded-lg bg-teal px-4 py-2 text-sm font-medium text-paper hover:bg-teal-dark"
        >
          + Nuevo tratamiento
        </Link>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-line bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-paper-dim text-ink-soft">
            <tr>
              <th className="px-4 py-3 font-medium">Nombre</th>
              <th className="px-4 py-3 font-medium">Estado</th>
              <th className="px-4 py-3 font-medium">Actualizado</th>
              <th className="px-4 py-3 font-medium text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {tratamientos.map((t) => (
              <tr key={t.id} className="border-t border-line">
                <td className="px-4 py-3 font-medium text-ink">{t.nombre}</td>
                <td className="px-4 py-3">
                  {t.publicado ? (
                    <span className="rounded-full bg-sage px-2.5 py-1 text-xs font-medium text-sage-ink">
                      Publicado
                    </span>
                  ) : (
                    <span className="rounded-full bg-paper-dim px-2.5 py-1 text-xs font-medium text-ink-soft">
                      Borrador
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-ink-soft">
                  {new Date(t.updated_at).toLocaleDateString("es-ES")}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-3">
                    <Link
                      href={`/admin/tratamientos/${t.id}/editar`}
                      className="font-medium text-cyan hover:text-cyan-dark"
                    >
                      Editar
                    </Link>
                    <DeleteTratamientoButton id={t.id} nombre={t.nombre} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
