import type { Clinic } from "@/lib/supabase/database.types";

/**
 * % de completitud de una ficha (básico + contenido de perfil
 * detallado juntos). Se usa tanto en el propio panel de la clínica
 * ("Tu ficha está al X%") como para decidir quién es elegible a
 * "Clínica destacada de la semana".
 */
export function calcularCompletitud(clinic: Clinic): number {
  const camposBasico: unknown[] = [
    clinic.nombre,
    clinic.descripcion,
    clinic.telefono,
    clinic.email,
    clinic.direccion,
    clinic.ciudad,
    clinic.logo_url,
    clinic.fotos.length > 0 ? "x" : null,
    clinic.tecnicas.length > 0 ? "x" : null,
    clinic.idiomas.length > 0 ? "x" : null,
    Array.isArray(clinic.horarios_estructurados) && clinic.horarios_estructurados.length > 0
      ? "x"
      : null,
  ];
  const camposDetallados: unknown[] = [
    clinic.descripcion_extendida,
    clinic.video_url,
    Array.isArray(clinic.medicos) && clinic.medicos.length > 0 ? "x" : null,
    Array.isArray(clinic.fotos_antes_despues) && clinic.fotos_antes_despues.length > 0
      ? "x"
      : null,
    Array.isArray(clinic.opiniones) && clinic.opiniones.length > 0 ? "x" : null,
    clinic.certificados.length > 0 ? "x" : null,
    clinic.tiene_oferta ? "x" : null,
  ];
  const todosLosCampos = [...camposBasico, ...camposDetallados];
  const rellenos = todosLosCampos.filter(Boolean).length;
  return Math.round((rellenos / todosLosCampos.length) * 100);
}
