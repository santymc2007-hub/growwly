export function BarraCategoria({
  etiqueta,
  valor,
  total,
  color = "#00c2d6",
}: {
  etiqueta: string;
  valor: number;
  total: number;
  color?: string;
}) {
  const porcentaje = total > 0 ? Math.round((valor / total) * 100) : 0;
  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-ink">{etiqueta}</span>
        <span className="font-medium text-ink-soft">{valor}</span>
      </div>
      <div className="mt-1 h-2 overflow-hidden rounded-full bg-paper-dim">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${porcentaje}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}
