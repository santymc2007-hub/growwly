/**
 * Oculta en Microsoft Clarity todo lo que hay dentro: Clarity sigue
 * contando clics y desplazamiento, pero sustituye textos e imágenes por
 * bloques. Va en las zonas con datos de salud o personales (cuenta del
 * paciente, panel de clínicas, leads, admin y el adelanto de la
 * valoración). `display: contents` para no alterar el diseño.
 */
export function MascaraClarity({ children }: { children: React.ReactNode }) {
  return (
    <div data-clarity-mask="true" className="contents">
      {children}
    </div>
  );
}
