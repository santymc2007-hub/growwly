import { CATEGORIAS_CENTRO } from "@/lib/clinic-options";

/**
 * Selector de categoría del centro (selección única), con una breve
 * descripción junto a cada opción. Ordenado de la categoría más médica
 * a la menos. Envía el valor en el campo `tipo_negocio`.
 */
export function SelectorCategoriaCentro({
  valorInicial,
  titulo = "Categoría del centro",
}: {
  valorInicial?: string | null;
  titulo?: string;
}) {
  return (
    <fieldset>
      <legend className="text-sm font-medium text-ink">{titulo}</legend>
      <p className="mt-0.5 text-xs text-ink-soft">
        Elige la que mejor describe tu actividad principal.
      </p>
      <div className="mt-2 grid gap-2">
        {CATEGORIAS_CENTRO.map((c) => (
          <label
            key={c.valor}
            className="flex cursor-pointer items-start gap-3 rounded-lg border border-line bg-white px-3 py-2.5 transition-colors hover:bg-paper-dim has-[:checked]:border-teal has-[:checked]:bg-sage/40"
          >
            <input
              type="radio"
              name="tipo_negocio"
              value={c.valor}
              defaultChecked={valorInicial === c.valor}
              className="mt-1 accent-teal"
            />
            <span className="min-w-0">
              <span className="block text-sm font-medium text-ink">{c.valor}</span>
              <span className="block text-xs text-ink-soft">{c.descripcion}</span>
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
