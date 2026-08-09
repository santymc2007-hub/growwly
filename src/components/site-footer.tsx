import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { slugifyCiudad } from "@/lib/clinic-options";

export async function SiteFooter() {
  const supabase = await createClient();
  const [{ data: clinicas }, { data: tratamientos }] = await Promise.all([
    supabase.from("clinics").select("ciudad").eq("publicado", true),
    supabase
      .from("tratamientos")
      .select("slug, nombre")
      .eq("publicado", true)
      .order("nombre", { ascending: true }),
  ]);

  const ciudades = Array.from(
    new Set((clinicas ?? []).map((c) => c.ciudad).filter((c): c is string => Boolean(c))),
  ).sort((a, b) => a.localeCompare(b, "es"));

  return (
    <footer className="border-t border-line bg-paper-dim">
      <div className="mx-auto max-w-[1600px] px-6 py-10 text-sm text-ink-soft">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-ink">
              Growwly
            </p>
            <p className="mt-3 text-xs">
              Directorio de clínicas capilares en España.
            </p>
          </div>

          {ciudades.length > 0 && (
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-ink">
                Clínicas por ciudad
              </p>
              <ul className="mt-3 flex flex-col gap-1.5 text-xs">
                {ciudades.map((c) => (
                  <li key={c}>
                    <Link href={`/clinicas/${slugifyCiudad(c)}`} className="hover:text-teal">
                      Clínicas en {c}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {(tratamientos ?? []).length > 0 && (
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-ink">
                Tratamientos
              </p>
              <ul className="mt-3 flex flex-col gap-1.5 text-xs">
                {(tratamientos ?? []).map((t) => (
                  <li key={t.slug}>
                    <Link href={`/tratamientos/${t.slug}`} className="hover:text-teal">
                      {t.nombre}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-ink">
              Legal
            </p>
            <ul className="mt-3 flex flex-col gap-1.5 text-xs">
              <li>
                <Link href="/legal/aviso-legal" className="hover:text-teal">
                  Aviso Legal
                </Link>
              </li>
              <li>
                <Link href="/legal/privacidad" className="hover:text-teal">
                  Privacidad
                </Link>
              </li>
              <li>
                <Link href="/legal/cookies" className="hover:text-teal">
                  Cookies
                </Link>
              </li>
              <li>
                <Link href="/legal/terminos" className="hover:text-teal">
                  Términos y Condiciones
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <p className="mt-8 border-t border-line pt-6 text-xs">
          © {new Date().getFullYear()} Growwly
        </p>
      </div>
    </footer>
  );
}
