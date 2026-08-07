import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { SiteHeader } from "@/components/site-header";
import { WaveDivider } from "@/components/wave-divider";
import { HeroSearch } from "@/components/home/hero-search";

function uniqueSorted(values: (string | null)[]): string[] {
  return Array.from(new Set(values.filter((v): v is string => Boolean(v)))).sort(
    (a, b) => a.localeCompare(b, "es"),
  );
}

export default async function HomePage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("clinics")
    .select("ciudad, tecnicas, verificado");
  const clinicas = data ?? [];

  const totalClinicas = clinicas.length;
  const totalVerificadas = clinicas.filter((c) => c.verificado).length;
  const ciudades = uniqueSorted(clinicas.map((c) => c.ciudad));
  const tecnicas = uniqueSorted(clinicas.flatMap((c) => c.tecnicas));

  return (
    <main className="flex-1">
      <SiteHeader />

      <section className="bg-teal text-paper">
        <div className="mx-auto max-w-3xl px-6 py-16 text-center sm:py-20">
          {totalClinicas > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-4 py-1.5 text-sm">
              ✨ {totalClinicas}{" "}
              {totalClinicas === 1
                ? "clínica en el directorio"
                : "clínicas en el directorio"}
            </span>
          )}

          <h1 className="mt-5 font-display text-4xl leading-tight sm:text-5xl">
            El crecimiento de tu cabello{" "}
            <em className="text-cyan not-italic">empieza aquí</em>
          </h1>

          <p className="mt-4 text-paper/85">
            Compara especialistas, lee reseñas reales y encuentra el mejor
            tratamiento capilar.
          </p>
          <p className="font-display text-lg">Hair we go!</p>

          <div className="mt-8">
            <HeroSearch ciudades={ciudades} tecnicas={tecnicas} />
          </div>

          {tecnicas.length > 0 && (
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
              <span className="text-sm text-paper/70">
                Búsquedas populares:
              </span>
              {tecnicas.slice(0, 4).map((t) => (
                <Link
                  key={t}
                  href={`/clinicas?tecnica=${encodeURIComponent(t)}`}
                  className="rounded-full bg-white/10 px-3 py-1 text-sm transition hover:bg-white/20"
                >
                  {t}
                </Link>
              ))}
            </div>
          )}
        </div>
        <WaveDivider />
      </section>

      <section className="mx-auto max-w-3xl px-6 py-14">
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-line bg-sage/40 px-6 py-10 text-center sm:px-12">
          <span className="rounded-full bg-cyan px-3 py-1 text-xs font-medium text-white">
            Gratis · 2 minutos
          </span>
          <h2 className="font-display text-2xl text-teal-dark sm:text-3xl">
            ¿No sabes por dónde empezar?
          </h2>
          <p className="max-w-md text-sm text-ink-soft">
            Sube 5 fotos de tu cabello (frontal, coronilla, nuca y ambos
            perfiles) y recibe una primera impresión orientativa en
            minutos — no es un diagnóstico, pero te ayuda a entender qué
            clínicas encajan con tu caso.
          </p>
          <Link
            href="/cuenta/analisis/nuevo"
            className="mt-2 inline-block rounded-lg bg-cyan px-6 py-3 text-sm font-medium text-white transition hover:bg-cyan-dark"
          >
            Analizar mis fotos →
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-6 pb-14 text-center">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
          <div>
            <p className="font-display text-2xl text-teal-dark">
              {totalVerificadas}
            </p>
            <p className="mt-1 text-sm text-ink-soft">
              {totalVerificadas === 1
                ? "clínica verificada por Growwly"
                : "clínicas verificadas por Growwly"}
            </p>
          </div>
          <div>
            <p className="font-display text-2xl text-teal-dark">Gratis</p>
            <p className="mt-1 text-sm text-ink-soft">
              comparar clínicas, sin compromiso
            </p>
          </div>
          <div>
            <p className="font-display text-2xl text-teal-dark">Directo</p>
            <p className="mt-1 text-sm text-ink-soft">
              contacta con la clínica sin intermediarios
            </p>
          </div>
        </div>

        <Link
          href="/clinicas"
          className="mt-10 inline-block rounded-lg bg-teal px-6 py-3 text-sm font-medium text-paper transition hover:bg-teal-dark"
        >
          Ver todas las clínicas →
        </Link>
      </section>
    </main>
  );
}
