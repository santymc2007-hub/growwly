/**
 * Sello «Verificado por Growwly» (decidido 25 oct 2026): el centro da su
 * registro sanitario y el nombre y nº de colegiado de su médico
 * responsable; el admin comprueba eso y los datos de contacto. El sello
 * (clinics.verificado) se concede solo con las tres comprobaciones.
 */

type DatosVerificacion = {
  registro_sanitario: string | null;
  medico_responsable: string | null;
  colegiado_responsable: string | null;
};

export function datosVerificacionCompletos(c: DatosVerificacion): boolean {
  return Boolean(
    c.registro_sanitario?.trim() && c.medico_responsable?.trim() && c.colegiado_responsable?.trim(),
  );
}

const norm = (v: string | null | undefined) => (v ?? "").trim().toLowerCase();

/** Campos que, si la clínica los cambia, retiran cada comprobación. */
const CAMPOS_REGISTRO = ["registro_sanitario"] as const;
const CAMPOS_COLEGIADO = ["medico_responsable", "colegiado_responsable"] as const;
const CAMPOS_CONTACTO = ["direccion", "telefono", "email", "web"] as const;

type Fila = Record<string, unknown>;

/**
 * Lo que hay que añadir al update de la clínica cuando ella misma cambia
 * datos ya comprobados: se desmarca la comprobación afectada y, si tenía
 * el sello, se retira.
 */
export function camposVerificacionTrasCambio(actual: Fila | null, nuevo: Fila) {
  if (!actual) return {};
  const cambia = (campos: readonly string[]) =>
    campos.some((k) => k in nuevo && norm(actual[k] as string) !== norm(nuevo[k] as string));
  const out: Record<string, boolean | null> = {};
  if (actual.verif_registro && cambia(CAMPOS_REGISTRO)) out.verif_registro = false;
  if (actual.verif_colegiado && cambia(CAMPOS_COLEGIADO)) out.verif_colegiado = false;
  if (actual.verif_contacto && cambia(CAMPOS_CONTACTO)) out.verif_contacto = false;
  if (Object.keys(out).length > 0 && actual.verificado) {
    out.verificado = false;
    out.verificado_en = null;
  }
  return out;
}
