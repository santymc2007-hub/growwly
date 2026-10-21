import { NextResponse } from "next/server";
import { buscarClinicasReclamables } from "@/lib/clinica/reclamables";

/**
 * Buscador de "Reclamar clínica" en /clinica/registro: devuelve hasta 8
 * fichas publicadas y sin gestor que coinciden con lo escrito. Solo id,
 * nombre y ciudad — datos que ya son públicos en el directorio.
 */
export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get("q") ?? "";
  if (q.length > 80) {
    return NextResponse.json({ resultados: [] });
  }
  const resultados = await buscarClinicasReclamables(q);
  return NextResponse.json(
    { resultados },
    { headers: { "Cache-Control": "no-store" } },
  );
}
