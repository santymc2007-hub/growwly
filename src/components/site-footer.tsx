import Image from "next/image";
import Link from "next/link";
import { slugifyCiudad, slugifyProvincia } from "@/lib/clinic-options";
import { tratamientosMenu, ciudadesConClinicas } from "@/lib/nav-publica-cache";
import { BotonPreferenciasCookies } from "@/components/analytics/boton-preferencias-cookies";

const LEGAL = [
  { href: "/legal/aviso-legal", texto: "Aviso legal" },
  { href: "/legal/privacidad", texto: "Privacidad" },
  { href: "/legal/cookies", texto: "Cookies" },
  { href: "/legal/terminos", texto: "Términos" },
  { href: "/como-ordenamos", texto: "Cómo ordenamos" },
  { href: "/denunciar", texto: "Denunciar un contenido" },
];

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
                Directorio de centros capilares en España.
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-white">
                Para centros
              </p>
              <ul className="mt-3 flex flex-col gap-1.5 text-xs">
                <li>
                  <Link href="/precios" className="hover:text-white">
                    Precios
                  </Link>
                </li>
                <li>
                  <Link href="/clinica/registro" className="hover:text-white">
                    Publicar mi centro gratis
                  </Link>
                </li>
                <li>
                  <Link href="/clinica/login" className="hover:text-white">
                    Acceso centros
                  </Link>
                </li>
              </ul>
            </div>

            {ciudades.length > 0 && (
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-white">
                  Centros por ciudad
                </p>
                <ul className="mt-3 flex flex-col gap-1.5 text-xs">
                  {ciudades.map(({ ciudad, provincia }) => (
                    <li key={ciudad}>
                      <Link
                        href={`/centros/${slugifyProvincia(provincia)}/${slugifyCiudad(ciudad)}`}
                        className="hover:text-white"
                      >
                        Centros en {ciudad}
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
          </div>

          {/* Textos legales en una línea, al pie: están en todas las
              páginas sin ocupar una columna entera. */}
          <div className="mt-8 flex flex-col gap-3 border-t border-white/15 pt-6 text-xs sm:flex-row sm:items-start sm:justify-between">
            <p className="shrink-0">© {new Date().getFullYear()} Growwly</p>
            <ul className="flex flex-wrap gap-x-4 gap-y-1.5 sm:justify-end">
              {LEGAL.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="hover:text-white"
                  >
                    {l.texto}
                  </Link>
                </li>
              ))}
              <li>
                <BotonPreferenciasCookies className="hover:text-white" />
              </li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
}
