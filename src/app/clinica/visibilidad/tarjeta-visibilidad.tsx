type Props = {
  icono: string;
  titulo: string;
  descripcion: string;
  activo: boolean;
  pendiente: boolean;
  action: () => void;
};

export function TarjetaVisibilidad({
  icono,
  titulo,
  descripcion,
  activo,
  pendiente,
  action,
}: Props) {
  return (
    <div className="rounded-2xl border border-line bg-white p-5">
      <p className="font-display text-base text-teal-dark">
        {icono} {titulo}
      </p>
      <p className="mt-1 text-sm text-ink-soft">{descripcion}</p>
      {activo ? (
        <span className="mt-3 inline-block rounded-full bg-teal px-3 py-1 text-xs font-medium text-paper">
          Activo
        </span>
      ) : pendiente ? (
        <span className="mt-3 inline-block rounded-full bg-paper-dim px-3 py-1 text-xs font-medium text-ink-soft">
          Pendiente de aprobación
        </span>
      ) : (
        <form action={action}>
          <button
            type="submit"
            className="mt-3 rounded-full bg-gradient-to-r from-brand-green to-brand-blue px-4 py-2 text-sm font-bold text-teal-dark transition hover:opacity-90"
          >
            Solicitar
          </button>
        </form>
      )}
    </div>
  );
}
