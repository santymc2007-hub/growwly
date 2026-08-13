import { createAdminClient } from "@/lib/supabase/admin";
import { TarjetaSolicitud } from "./tarjeta-solicitud";

export const dynamic = "force-dynamic";

export default async function SolicitudesPage() {
  const supabase = createAdminClient();

  const { data: clinicas } = await supabase
    .from("clinics")
    .select(
      "id, nombre, destacado_solicitado, destacado_home_solicitado, destacado_ciudad_solicitado, plan_solicitado",
    )
    .or(
      "destacado_solicitado.eq.true,destacado_home_solicitado.eq.true,destacado_ciudad_solicitado.eq.true,plan_solicitado.not.is.null",
    )
    .order("nombre", { ascending: true });

  type Fila = {
    clinicId: string;
    clinicNombre: string;
    tipo: "destacado" | "destacado_home" | "destacado_ciudad" | "premium";
  };

  const filas: Fila[] = [];
  for (const c of clinicas ?? []) {
    if (c.destacado_solicitado) {
      filas.push({ clinicId: c.id, clinicNombre: c.nombre, tipo: "destacado" });
    }
    if (c.destacado_home_solicitado) {
      filas.push({ clinicId: c.id, clinicNombre: c.nombre, tipo: "destacado_home" });
    }
    if (c.destacado_ciudad_solicitado) {
      filas.push({ clinicId: c.id, clinicNombre: c.nombre, tipo: "destacado_ciudad" });
    }
    if (c.plan_solicitado) {
      filas.push({ clinicId: c.id, clinicNombre: c.nombre, tipo: "premium" });
    }
  }

  return (
    <div>
      <h1 className="font-display text-2xl text-teal-dark">Solicitudes</h1>
      <p className="mt-1 text-sm text-ink-soft">
        Peticiones de visibilidad y plan Premium pendientes de aprobar.
      </p>

      {filas.length > 0 ? (
        <div className="mt-6 flex flex-col gap-3">
          {filas.map((f) => (
            <TarjetaSolicitud
              key={`${f.clinicId}-${f.tipo}`}
              clinicId={f.clinicId}
              clinicNombre={f.clinicNombre}
              tipo={f.tipo}
            />
          ))}
        </div>
      ) : (
        <p className="mt-6 text-sm text-ink-soft">
          No hay ninguna solicitud pendiente ahora mismo.
        </p>
      )}
    </div>
  );
}
