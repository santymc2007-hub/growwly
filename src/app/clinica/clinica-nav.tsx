import Link from "next/link";

type Seccion = "ficha" | "solicitudes" | "visibilidad" | "facturacion";

export function ClinicaNav({
  activo,
  solicitudesPendientes = 0,
}: {
  activo: Seccion;
  /** Solicitudes de presupuesto sin desbloquear — resalta la pestaña. */
  solicitudesPendientes?: number;
}) {
  const tab = (href: string, label: string, key: Seccion, badge?: number) => (
    <Link
      href={href}
      className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
        activo === key
          ? "bg-teal text-paper"
          : "bg-white text-ink-soft hover:text-teal"
      }`}
    >
      {label}
      {Boolean(badge) && (
        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-yellow px-1.5 text-xs font-bold text-teal-dark">
          {badge}
        </span>
      )}
    </Link>
  );

  return (
    <nav className="mb-6 flex flex-wrap gap-2">
      {tab("/clinica", "Ficha", "ficha")}
      {tab(
        "/clinica/solicitudes",
        "Solicitudes de presupuesto",
        "solicitudes",
        solicitudesPendientes,
      )}
      {tab("/clinica/visibilidad", "Visibilidad", "visibilidad")}
      {tab("/clinica/facturacion", "Datos de facturación", "facturacion")}
    </nav>
  );
}
