// Mapeo tratamiento -> icono (nombre exacto tal como sale en
// TECNICAS_POR_CATEGORIA / tratamientos.nombre), y categoría -> icono
// de categoría + degradado de marca. Todo comparado en minúsculas y
// sin espacios sobrantes para no depender de un match exacto de caja.

const ICONO_POR_TRATAMIENTO: Record<string, string> = {
  "consulta tricológica": "consulta-tricologica",
  "analítica capilar": "analitica-capilar",
  minoxidil: "minoxidil",
  "finasteride / dutasteride": "finasteride-dutasteride",
  "mesoterapia capilar": "mesoterapia-capilar",
  prp: "prp",
  "láser de baja intensidad": "laser-baja-intensidad",
  "injerto fue": "injerto-fue",
  "injerto dhi": "injerto-dhi",
  "injerto fut": "injerto-fut",
  "injerto sin afeitado": "injerto-sin-afeitado",
  "injerto de barba": "injerto-barba",
  "injerto de cejas": "injerto-cejas",
  "micropigmentación capilar": "micropigmentacion-capilar",
  "extensiones de cabello": "extensiones-cabello",
  "pelucas y prótesis capilares": "pelucas-protesis-capilares",
};

const ICONO_POR_CATEGORIA: Record<string, string> = {
  "diagnóstico y consulta": "consulta-tricologica",
  "tratamientos médicos": "cat-tratamientos-medicos",
  "injerto capilar": "cat-injerto-capilar",
  "estética capilar": "cat-estetica-capilar",
};

export const GRADIENTE_POR_CATEGORIA: Record<string, string> = {
  "Diagnóstico y consulta": "from-teal-dark to-cyan",
  "Tratamientos médicos": "from-cyan-dark to-brand-blue",
  "Injerto capilar": "from-brand-green to-brand-blue",
  "Estética capilar": "from-yellow to-orange",
};
export const GRADIENTE_DEFECTO = "from-teal-dark to-cyan";

function normalizar(texto: string): string {
  return texto.trim().toLowerCase();
}

export function iconoDeTratamiento(nombre: string): string | null {
  const clave = ICONO_POR_TRATAMIENTO[normalizar(nombre)];
  return clave ? `/brand/iconos-tratamientos/${clave}.png` : null;
}

export function iconoDeCategoria(categoria: string): string | null {
  const clave = ICONO_POR_CATEGORIA[normalizar(categoria)];
  return clave ? `/brand/iconos-tratamientos/${clave}.png` : null;
}

export function gradienteDeCategoria(categoria: string | null): string {
  return (categoria && GRADIENTE_POR_CATEGORIA[categoria]) || GRADIENTE_DEFECTO;
}
