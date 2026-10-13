// Tipos y textos compartidos de Visibilidad. En un fichero aparte (sin
// "use server") porque un módulo de Server Actions solo puede exportar
// funciones async — no puede exportar también estas constantes.

export type TipoVisibilidad =
  | "destacado"
  | "destacado_home"
  | "destacado_ciudad"
  | "premium";

// Mismos textos que ve la clínica en /clinica/visibilidad — si cambian
// ahí, cambiarlos también aquí para que el email no se desincronice.
export const TIPO_LABEL: Record<TipoVisibilidad, string> = {
  destacado: "Destacada en el listado",
  destacado_home: "Destacada en la Home",
  destacado_ciudad: "Destacada en tu ciudad",
  premium: "Perfil ampliado",
};

// Mismo beneficio que ve la clínica en la tarjeta de /clinica/visibilidad.
export const BENEFICIO_LABEL: Record<TipoVisibilidad, string> = {
  destacado: "Más pacientes te ven primero al comparar centros de tu zona.",
  destacado_home: "Visibilidad máxima: es lo primero que ve cualquier visitante de Growwly.",
  destacado_ciudad: "Ganas a la competencia local cuando buscan centros cerca.",
  premium: "Ficha completa = más confianza del paciente = más leads convertidos.",
};
