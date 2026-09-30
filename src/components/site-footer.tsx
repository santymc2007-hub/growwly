import Image from "next/image";
import Link from "next/link";
import { slugifyCiudad, slugifyProvincia } from "@/lib/clinic-options";
import { tratamientosMenu, ciudadesConClinicas } from "@/lib/nav-publica-cache";
import { BotonPreferenciasCookies } from "@/components/analytics/boton-preferencias-cookies";

export async function SiteFooter() {
  const [tratamientos, ciudades] = await Promise.all([
    tratamientosMenu(),
    ciudadesConClinicas(),
  ]);

  return (
    <div className="mx-auto max-w-[1400px] px-3 pb-8 sm:px-6 sm:pb-10">
      <footer className="overflow-hidden rounded-3xl bg-teal-dark text-white/70 shadow-sm">
        <div className="px-6 py-10 text-sm sm:px-10">
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            <div>
              <Image
                src="/brand/growwly-logo-white.png"
                alt="Growwly"
                width={110}
                height={38}
                className="h-8 w-auto"
              />
              <p className="mt-3 text-xs">
                Directorio de clínicas capilares en España.
              </p>
            </div>

            {ciudades.length > 0 && (
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-white">
                  Clínicas por ciudad
                </p>
                <ul className="mt-3 flex flex-col gap-1.5 text-xs">
                  {ciudades.map(({ ciudad, provincia }) => (
                    <li key={ciudad}>
                      <Link
                        href={`/clinicas/${slugifyProvincia(provincia)}/${slugifyCiudad(ciudad)}`}
                        className="hover:text-white"
                      >
                        Clínicas en {ciudad}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {tratamientos.length > 0 && (
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-white">
                  Tratamientos
                </p>
                <ul className="mt-3 flex flex-col gap-1.5 text-xs">
                  {tratamientos.map((t) => (
                    <li key={t.slug}>
                      <Link href={`/tratamientos/${t.slug}`} className="hover:text-white">
                        {t.nombre}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-white">
                Legal
              </p>
              <ul className="mt-3 flex flex-col gap-1.5 text-xs">
                <li>
                  <Link href="/legal/aviso-legal" className="hover:text-white">
                    Aviso Legal
                  </Link>
                </li>
                <li>
                  <Link href="/legal/privacidad" className="hover:text-white">
                    Privacidad
                  </Link>
                </li>
                <li>
                  <Link href="/legal/cookies" className="hover:text-white">
                    Cookies
                  </Link>
                </li>
                <li>
                  <Link href="/legal/terminos" className="hover:text-white">
                    Términos y Condiciones
                  </Link>
                </li>
                <li>
                  <BotonPreferenciasCookies />
                </li>
              </ul>
            </div>
          </div>

          <p className="mt-8 border-t border-white/15 pt-6 text-xs">
            © {new Date().getFullYear()} Growwly
          </p>
        </div>
      </footer>
    </div>
  );
}
