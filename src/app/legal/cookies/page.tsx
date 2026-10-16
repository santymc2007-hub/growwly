import type { Metadata } from "next";
import { LegalLayout } from "@/components/legal/legal-layout";
import { BotonPreferenciasCookies } from "@/components/analytics/boton-preferencias-cookies";
import {
  COOKIES_ANALITICAS,
  COOKIES_NECESARIAS,
  COOKIES_PUBLICIDAD,
  PUBLICIDAD_ACTIVA,
  type FilaCookie,
} from "@/lib/cookies/config";

export const metadata: Metadata = {
  title: "Política de Cookies",
  alternates: { canonical: "/legal/cookies" },
};

function TablaCookies({ filas }: { filas: FilaCookie[] }) {
  const conTransferencia = filas.some((f) => f.transferencia);
  return (
    <div className="not-prose overflow-x-auto">
      <table className="w-full border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-line text-ink">
            <th className="py-2 pr-4 font-medium">Cookie</th>
            <th className="py-2 pr-4 font-medium">Quién la pone</th>
            <th className="py-2 pr-4 font-medium">Para qué</th>
            <th className="py-2 pr-4 font-medium">Duración</th>
            {conTransferencia && <th className="py-2 font-medium">Datos fuera de la UE</th>}
          </tr>
        </thead>
        <tbody className="text-ink-soft">
          {filas.map((f) => (
            <tr key={f.nombre} className="border-b border-line align-top">
              <td className="py-2 pr-4 font-mono text-xs text-ink">{f.nombre}</td>
              <td className="py-2 pr-4">{f.proveedor}</td>
              <td className="py-2 pr-4">{f.finalidad}</td>
              <td className="py-2 pr-4 whitespace-nowrap">{f.duracion}</td>
              {conTransferencia && <td className="py-2">{f.transferencia ?? "No"}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Las tablas salen de lib/cookies/config.ts, la misma configuración
 * que usa el banner: si se añade una cookie o un píxel, se añade allí.
 */
export default function CookiesPage() {
  return (
    <LegalLayout activo="/legal/cookies">
      <h1>Política de Cookies</h1>
      <p>
        <em>Última actualización: 16 de octubre de 2026.</em>
      </p>

      <h2>Qué son las cookies</h2>
      <p>
        Son pequeños archivos que una web guarda en tu navegador. Aquí también
        incluimos tecnologías parecidas, como el almacenamiento local del
        navegador. Growwly, de Santiago Mulet Cortés (ver{" "}
        <a href="/legal/aviso-legal">Aviso Legal</a>), usa las que se
        detallan abajo.
      </p>

      <h2>Cookies necesarias</h2>
      <p>
        Son imprescindibles para que la web funcione (por ejemplo, para que no
        tengas que iniciar sesión en cada página). No necesitan tu
        consentimiento y no se usan para nada más.
      </p>
      <TablaCookies filas={COOKIES_NECESARIAS} />

      <h2>Cookies analíticas</h2>
      <p>
        Solo se activan si las aceptas. Nos dicen cuántas personas visitan
        Growwly y qué páginas usan, para mejorar la web. No las usamos para
        publicidad ni las cruzamos con tus datos de salud.
      </p>
      <TablaCookies filas={COOKIES_ANALITICAS} />

      {PUBLICIDAD_ACTIVA ? (
        <>
          <h2>Cookies de publicidad</h2>
          <p>
            Solo se activan si las aceptas. Sirven para saber si alguien llega
            a Growwly desde uno de nuestros anuncios y medir sus resultados.
            Nunca se envían datos de salud ni de tus solicitudes.
          </p>
          <TablaCookies filas={COOKIES_PUBLICIDAD} />
        </>
      ) : (
        <>
          <h2>Cookies de publicidad</h2>
          <p>
            Ahora mismo Growwly no usa cookies de publicidad. Si algún día las
            usamos, te pediremos permiso antes en el aviso de cookies.
          </p>
        </>
      )}

      <h2>Servicios de terceros sin cookies</h2>
      <ul>
        <li>
          <strong>Mapas (OpenStreetMap):</strong> al cargar un mapa, tu
          navegador pide las imágenes a OpenStreetMap, que recibe tu dirección
          IP. No deja cookies.
        </li>
        <li>
          <strong>Vídeos de las clínicas (YouTube o Vimeo):</strong> se
          cargan en modo sin cookies. YouTube o Vimeo solo pueden poner las
          suyas si reproduces el vídeo.
        </li>
        <li>
          <strong>Iniciar sesión con Google:</strong> si eliges esta opción,
          Google pone sus cookies en su propia web durante el inicio de sesión.
        </li>
        <li>
          <strong>Rendimiento de la web (Vercel Speed Insights):</strong> mide
          la velocidad de carga de forma anónima, sin cookies.
        </li>
      </ul>

      <h2>Cómo cambiar o retirar tu consentimiento</h2>
      <p>
        Puedes aceptar, rechazar o cambiar cada tipo de cookie cuando quieras.
        Al retirar el consentimiento, borramos esas cookies de tu navegador.
        Te volveremos a preguntar como mucho cada 24 meses.
      </p>
      <p className="not-prose">
        <BotonPreferenciasCookies className="press rounded-lg border border-line px-4 py-2 text-sm font-medium text-teal-dark hover:border-teal">
          Cambiar mis preferencias de cookies
        </BotonPreferenciasCookies>
      </p>
      <p>
        También puedes borrar o bloquear las cookies desde la configuración de
        tu navegador. Si bloqueas las necesarias, no podrás iniciar sesión.
      </p>
      <p>
        Más información sobre cómo tratamos tus datos en la{" "}
        <a href="/legal/privacidad">Política de Privacidad</a>.
      </p>
    </LegalLayout>
  );
}
