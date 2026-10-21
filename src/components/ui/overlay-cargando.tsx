import { LogoCargando } from "./logo-cargando";

/**
 * Capa que bloquea toda la pantalla mientras dura una acción larga
 * (guardar la ficha, lanzar una valoración con IA...) — para que quede
 * claro que se está trabajando y no se pueda tocar nada mientras tanto.
 * No usar para búsquedas/filtros rápidos: ahí un indicador pequeño e
 * inline molesta menos que tapar la pantalla entera.
 *
 * Fondo blanco translúcido (no oscuro) para que el logo de carga se vea
 * con sus colores.
 */
export function OverlayCargando({ mensaje }: { mensaje: string }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-white/85 px-6 backdrop-blur-sm">
      <LogoCargando ancho={200} etiqueta={mensaje} />
      <p className="max-w-xs text-center text-sm font-medium text-teal-dark">
        {mensaje}
      </p>
    </div>
  );
}
