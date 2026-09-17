/**
 * Capa que bloquea toda la pantalla mientras dura una acción larga
 * (guardar la ficha, lanzar una valoración con IA...) — para que quede
 * claro que se está trabajando y no se pueda tocar nada mientras tanto.
 * No usar para búsquedas/filtros rápidos: ahí un indicador pequeño e
 * inline molesta menos que tapar la pantalla entera.
 */
export function OverlayCargando({ mensaje }: { mensaje: string }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-ink/60 backdrop-blur-sm">
      <div
        className="h-10 w-10 animate-spin rounded-full border-4 border-white/30 border-t-white"
        aria-hidden
      />
      <p className="max-w-xs text-center text-sm font-medium text-white">
        {mensaje}
      </p>
    </div>
  );
}
