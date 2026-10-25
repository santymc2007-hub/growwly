import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { FondoTextura } from "@/components/fondo-textura";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { SelloScore } from "@/components/ui/sello-score";
import { VerifiedBadge } from "@/components/clinics/verified-badge";
import { getRanking } from "@/lib/seo/mejores-datos";
import { PESOS_RANKING, TEMA_GENERAL } from "@/lib/seo/mejores";
import { enFrase, hrefFicha } from "@/lib/seo/landings";
import { tituloSeo, textoTitle, metaSeo, OG_BASE } from "@/lib/seo/meta";
import { serializarJsonLd } from "@/lib/json-ld";
import { SITE_URL } from "@/lib/site-url";

type Params = { tema: string; provincia: string };

const MES = () =>
  new Date().toLocaleDateString("es-ES", { month: "long", year: "numeric", timeZone: "Europe/Madrid" });
const ANIO = () => new Date().toLocaleDateString("es-ES", { year: "numeric", timeZone: "Europe/Madrid" });

function queEs(d: NonNullable<Awaited<ReturnType<typeof getRanking>>>) {
  return d.tratamiento ? `clínicas de ${enFrase(d.tratamiento.nombre)}` : "clínicas capilares";
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { tema, provincia } = await params;
  const d = await getRanking(tema, provincia);
  if (!d) return {};
  const url = `/mejores/${tema}/${provincia}`;
  const que = queEs(d);
  const title = tituloSeo(
    `Las mejores ${que} en ${d.lugar} (${ANIO()})`,
    `Mejores ${que} en ${d.lugar} (${ANIO()})`,
    `Mejores ${que} en ${d.lugar}`,
  );
  const description = metaSeo(
    `Ranking de las mejores ${que} en ${d.lugar} según el Growwly Score: reseñas de Google y fichas completas.`,
    ["Sin posiciones de pago."],
    "Compara y pide presupuesto gratis.",
  );
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { ...OG_BASE, url, title: textoTitle(title), description },
  };
}

export default async function RankingPage({ params }: { params: Promise<Params> }) {
  const { tema, provincia } = await params;
  const d = await getRanking(tema, provincia);
  if (!d) notFound();

  const que = queEs(d);
  const url = `/mejores/${tema}/${provincia}`;
  const listado = d.tratamiento ? `/tratamientos/${d.tratamiento.slug}/${provincia}` : `/centros/${provincia}`;

  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `Las mejores ${que} en ${d.lugar}`,
    url: `${SITE_URL}${url}`,
    numberOfItems: d.filas.length,
    itemListOrder: "https://schema.org/ItemListOrderDescending",
    itemListElement: d.filas.map((f, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: f.clinica.nombre,
      url: `${SITE_URL}${hrefFicha(f.clinica)}`,
    })),
  };

  const pct = (p: number) => `${Math.round(p * 100)} %`;

  return (
    <main className="relative flex-1">
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: serializarJsonLd(itemList) }}
      />
      <FondoTextura />
      <SiteHeader />

      <div className="mx-auto max-w-[1100px] px-4 pb-6 pt-8 sm:px-6">
        <Breadcrumbs
          items={[
            { label: "Centros", href: "/centros" },
            { label: d.lugar, href: `/centros/${provincia}` },
            { label: `Mejores ${que}`, href: url },
          ]}
        />
        <h1 className="mt-3 font-display text-3xl text-ink sm:text-5xl">
          Las mejores <span className="text-teal-dark">{que}</span> en {d.lugar} ({ANIO()})
        </h1>
        <p className="mt-3 max-w-2xl text-ink-soft">
          De los {d.totalCentros} centros que hay en Growwly en {d.lugar}
          {d.tratamiento ? ` con ${enFrase(d.tratamiento.nombre)}` : ""}, estos son los{" "}
          {d.filas.length} con mejor Growwly Score: los que mejor valoran sus pacientes en Google y
          los que más información dan en su ficha. Nadie paga por salir aquí.
        </p>
        <p className="mt-2 text-xs text-ink-soft">Actualizado en {MES()}.</p>
      </div>

      <div className="mx-auto max-w-[1100px] px-3 pb-8 sm:px-6">
        <ol className="flex flex-col gap-3">
          {d.filas.map((f, i) => {
            const c = f.clinica;
            const foto = c.fotos[0];
            return (
              <li key={c.id}>
                <Link
                  href={hrefFicha(c)}
                  className="flex items-center gap-3 rounded-3xl bg-white p-3 shadow-sm transition hover:shadow-md sm:gap-5 sm:p-4"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-dark font-display text-lg font-bold text-white sm:h-11 sm:w-11 sm:text-xl">
                    {i + 1}
                  </span>
                  <div className="relative hidden h-20 w-28 shrink-0 overflow-hidden rounded-2xl bg-sage sm:block">
                    {foto && <Image src={foto} alt="" fill sizes="112px" className="object-cover" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="font-display text-lg leading-tight text-ink sm:text-xl">{c.nombre}</h2>
                    <p className="mt-0.5 text-xs text-ink-soft sm:text-sm">
                      {[c.ciudad, c.tipo_negocio].filter(Boolean).join(" · ")}
                    </p>
                    <ul className="mt-2 flex flex-wrap gap-1.5">
                      {f.motivos.map((m) =>
                        m === "Verificado por Growwly" ? (
                          <li key={m}>
                            <VerifiedBadge />
                          </li>
                        ) : (
                          <li
                            key={m}
                            className="rounded-full bg-sage px-2.5 py-0.5 text-[11px] font-medium text-sage-ink sm:text-xs"
                          >
                            {m}
                          </li>
                        ),
                      )}
                    </ul>
                  </div>
                  <SelloScore tipo="growwly" valor={f.score} size={72} />
                </Link>
              </li>
            );
          })}
        </ol>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href={listado}
            className="rounded-full bg-teal-dark px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal"
          >
            Ver los {d.totalCentros} centros en {d.lugar}
          </Link>
          <Link
            href="/analisis/nuevo"
            className="rounded-full bg-yellow px-5 py-2.5 text-sm font-semibold text-ink hover:brightness-95"
          >
            Valoración capilar gratis
          </Link>
        </div>

        <section className="mt-10 rounded-3xl bg-white p-6 shadow-sm sm:p-8">
          <h2 className="font-display text-2xl text-teal-dark">¿Cómo se calcula el Growwly Score?</h2>
          <p className="mt-2 text-sm text-ink-soft">
            Es una puntuación de 0 a 100 que calculamos con datos públicos y con lo que cada centro
            cuenta en su ficha. Se recalcula sola cada vez que cambian esos datos.
          </p>
          <ul className="mt-4 grid gap-2 text-sm text-ink sm:grid-cols-2">
            <li>
              <strong>{pct(PESOS_RANKING.notaGoogle)}</strong> · Nota en Google, con más peso cuantas
              más reseñas tiene (un 5★ con 7 reseñas no gana a un 4,8★ con 800).
            </li>
            <li>
              <strong>{pct(PESOS_RANKING.volumenResenas)}</strong> · Número de reseñas en Google.
            </li>
            <li>
              <strong>{pct(PESOS_RANKING.resenasRecientes)}</strong> · Que tenga reseñas recientes.
            </li>
            <li>
              <strong>{pct(PESOS_RANKING.fichaCompleta)}</strong> · Ficha completa: descripción, fotos,
              horarios, contacto, técnicas, registro sanitario, financiación, parking…
            </li>
            <li>
              <strong>{pct(PESOS_RANKING.fichaActualizada)}</strong> · Ficha actualizada recientemente.
            </li>
          </ul>
          <p className="mt-4 text-sm text-ink-soft">
            Ser cliente de pago de Growwly no suma puntos: los planes Premium y los Destacados no
            cuentan en este ranking. Tampoco es una valoración médica de los centros; para eso,
            pide una consulta y compara presupuestos.{" "}
            <Link href="/como-ordenamos" className="font-medium text-cyan hover:text-cyan-dark">
              Más sobre cómo ordenamos →
            </Link>
          </p>
          {d.tema !== TEMA_GENERAL && (
            <p className="mt-3 text-sm">
              <Link
                href={`/mejores/${TEMA_GENERAL}/${provincia}`}
                className="font-medium text-cyan hover:text-cyan-dark"
              >
                Ver las mejores clínicas capilares en {d.lugar} →
              </Link>
            </p>
          )}
        </section>
      </div>

      <SiteFooter />
    </main>
  );
}
