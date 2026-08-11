import Link from "next/link";

type Seccion = "ficha" | "solicitudes" | "visibilidad" | "facturacion";

export function ClinicaNav({ activo }: { activo: Seccion }) {
  const tab = (href: string, label: string, key: Seccion) => (
    <Link
      href={href}
      className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
        activo === key
          ? "bg-teal text-paper"
          : "bg-white text-ink-soft hover:text-teal"
      }`}
    >
      {label}
    </Link>
  );

  return (
    <nav className="mb-6 flex flex-wrap gap-2">
      {tab("/clinica", "Ficha", "ficha")}
      {tab("/clinica/solicitudes", "Solicitudes de presupuesto", "solicitudes")}
      {tab("/clinica/visibilidad", "Visibilidad", "visibilidad")}
      {tab("/clinica/facturacion", "Datos de facturación", "facturacion")}
    </nav>
  );
}
