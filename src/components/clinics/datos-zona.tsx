import Link from "next/link";
import type { ReactNode } from "react";
import type { Clinic } from "@/lib/supabase/database.types";
import { nombreVisibleTecnica } from "@/lib/tecnicas-visibles";
import { enFrase } from "@/lib/seo/landings";

/**
 * «{lugar} en cifras»: resumen calculado SOLO con los datos de los
 * centros listados (nota de Google, consulta gratis, financiación,
 * idiomas, tipo de centro, técnicas) y, en las ciudades, a qué distancia
 * están las otras ciudades de la provincia. Da contexto útil en listados
 * con pocos centros (Semrush los marcaba por poco texto) sin escribir
 * nada que no salga de los datos.
 */

export type CiudadCercana = { ciudad: string; href: string; n: number; km: number };

const coma = (n: number, dec = 1) => n.toFixed(dec).replace(".", ",");

function contar<T>(items: T[]): [T, number][] {
  const m = new Map<T, number>();
  for (const i of items) m.set(i, (m.get(i) ?? 0) + 1);
  return [...m].sort((a, b) => b[1] - a[1]);
}

function centroide(cs: Pick<Clinic, "lat" | "lng">[]): { lat: number; lng: number } | null {
  const conCoords = cs.filter((c) => c.lat != null && c.lng != null);
  if (conCoords.length === 0) return null;
  return {
    lat: conCoords.reduce((s, c) => s + (c.lat as number), 0) / conCoords.length,
    lng: conCoords.reduce((s, c) => s + (c.lng as number), 0) / conCoords.length,
  };
}

function km(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const rad = (g: number) => (g * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
}

/** Otras ciudades de la provincia ordenadas por distancia (en línea recta). */
export function ciudadesCercanas(
  ciudad: string,
  todas: Clinic[],
  hrefCiudad: (ciudad: string) => string,
  max = 4,
): CiudadCercana[] {
  const origen = centroide(todas.filter((c) => c.ciudad === ciudad));
  if (!origen) return [];
  const porCiudad = new Map<string, Clinic[]>();
  for (const c of todas) {
    if (!c.ciudad || c.ciudad === ciudad) continue;
    porCiudad.set(c.ciudad, [...(porCiudad.get(c.ciudad) ?? []), c]);
  }
  const lista: CiudadCercana[] = [];
  for (const [nombre, cs] of porCiudad) {
    const centro = centroide(cs);
    if (centro) lista.push({ ciudad: nombre, href: hrefCiudad(nombre), n: cs.length, km: km(origen, centro) });
  }
  return lista.sort((a, b) => a.km - b.km).slice(0, max);
}

export function DatosZona({
  lugar,
  centros,
  conTecnicas = false,
  cercanas = [],
}: {
  lugar: string;
  centros: Clinic[];
  /** Listar las técnicas que se ofrecen (no en la landing de un tratamiento). */
  conTecnicas?: boolean;
  cercanas?: CiudadCercana[];
}) {
  const n = centros.length;
  if (n === 0) return null;

  const filas: { etiqueta: string; valor: ReactNode }[] = [];

  const conNota = centros.filter((c) => c.rating_google != null);
  if (conNota.length > 0) {
    const media = conNota.reduce((s, c) => s + (c.rating_google as number), 0) / conNota.length;
    const resenas = conNota.reduce((s, c) => s + (c.resenas_google ?? 0), 0);
    filas.push({
      etiqueta: "Nota media en Google",
      valor: `${coma(media)}★${resenas > 0 ? ` (${resenas.toLocaleString("es-ES")} reseñas en total)` : ""}${
        conNota.length < n ? `, de ${conNota.length} de los ${n} centros` : ""
      }`,
    });
  }

  const gratis = centros.filter((c) => c.primera_consulta_gratis).length;
  if (gratis > 0) {
    filas.push({ etiqueta: "Primera consulta gratis", valor: `${gratis} de ${n} ${n === 1 ? "centro" : "centros"}` });
  }

  const financian = centros.filter((c) => c.financiacion).length;
  if (financian > 0) {
    filas.push({ etiqueta: "Con financiación", valor: `${financian} de ${n} ${n === 1 ? "centro" : "centros"}` });
  }

  const idiomas = contar(centros.flatMap((c) => c.idiomas).filter((i) => i !== "Español"));
  if (idiomas.length > 0) {
    filas.push({
      etiqueta: "Atienden en otros idiomas",
      valor: idiomas.map(([i, k]) => `${i.toLowerCase()} (${k})`).join(", "),
    });
  }

  const tipos = contar(centros.map((c) => c.tipo_negocio).filter((t): t is string => Boolean(t)));
  if (tipos.length > 0) {
    filas.push({
      etiqueta: "Tipo de centro",
      valor: tipos.map(([t, k]) => `${enFrase(t)} (${k})`).join(", "),
    });
  }

  if (conTecnicas) {
    const tecnicas = contar(centros.flatMap((c) => c.tecnicas));
    if (tecnicas.length > 0) {
      filas.push({
        etiqueta: "Tratamientos que ofrecen",
        valor: tecnicas.map(([t, k]) => `${nombreVisibleTecnica(t)} (${k})`).join(", "),
      });
    }
  }

  if (cercanas.length > 0) {
    filas.push({
      etiqueta: "Más centros cerca",
      valor: (
        <>
          {cercanas.map((c, i) => (
            <span key={c.href}>
              {i > 0 && ", "}
              <Link href={c.href} className="text-cyan hover:text-cyan-dark">
                {c.ciudad}
              </Link>{" "}
              ({c.n} {c.n === 1 ? "centro" : "centros"}, a {Math.max(1, Math.round(c.km))} km)
            </span>
          ))}
        </>
      ),
    });
  }

  if (filas.length === 0) return null;

  return (
    <section className="mt-10 border-t border-line pt-6">
      <h2 className="font-display text-2xl text-ink">{lugar} en cifras</h2>
      <p className="mt-1 text-sm text-ink-soft">
        Calculado con los datos de {n === 1 ? "el centro listado" : `los ${n} centros listados`} en Growwly.
      </p>
      <dl className="mt-4 grid gap-x-8 gap-y-3 text-sm sm:grid-cols-[max-content_1fr]">
        {filas.map((f) => (
          <div key={f.etiqueta} className="contents">
            <dt className="font-medium text-ink">{f.etiqueta}</dt>
            <dd className="text-ink-soft">{f.valor}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
