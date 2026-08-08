import Link from "next/link";

export function ClinicaNav({ activo }: { activo: "solicitudes" | "ficha" }) {
  const tab = (href: string, label: string, key: typeof activo) => (
    <Link
      href={href}
      className={`border-b-2 px-1 pb-2 text-sm font-medium ${
        activo === key
          ? "border-teal text-teal-dark"
          : "border-transparent text-ink-soft hover:text-teal"
      }`}
    >
      {label}
    </Link>
  );

  return (
    <nav className="mb-6 flex gap-6 border-b border-line">
      {tab("/clinica", "Solicitudes de presupuesto", "solicitudes")}
      {tab("/clinica/ficha", "Ficha", "ficha")}
    </nav>
  );
}
