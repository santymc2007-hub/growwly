import type { Metadata } from "next";
import { LegalLayout } from "@/components/legal/legal-layout";

export const metadata: Metadata = {
  title: "Política de Cookies",
  alternates: { canonical: "/legal/cookies" },
};

export default function CookiesPage() {
  return (
    <LegalLayout activo="/legal/cookies">
      <h1>Política de Cookies</h1>
      <p>
        <em>
          Esta política refleja únicamente las cookies que la web usa
          realmente en este momento. Si en el futuro se añaden herramientas
          de analítica, publicidad o marketing, esta página deberá
          actualizarse (y probablemente hará falta un panel de
          consentimiento de cookies).
        </em>
      </p>

      <h2>¿Qué son las cookies?</h2>
      <p>
        Las cookies son pequeños archivos que se almacenan en tu navegador
        al visitar un sitio web.
      </p>

      <h2>Cookies que usamos</h2>
      <p>
        Actualmente, Growwly solo utiliza <strong>cookies técnicas o
        necesarias</strong>, imprescindibles para el funcionamiento del
        sitio:
      </p>
      <ul>
        <li>
          <strong>Cookies de sesión (autenticación):</strong> nos permiten
          reconocer que has iniciado sesión (como paciente, clínica o
          administrador) mientras navegas por la web, y mantener tu sesión
          iniciada de forma segura.
        </li>
      </ul>
      <p>
        Este tipo de cookies no requieren tu consentimiento previo según la
        normativa vigente, al ser estrictamente necesarias para prestar el
        servicio que has solicitado.
      </p>

      <h2>Cookies que no usamos (todavía)</h2>
      <p>
        Growwly no utiliza, a día de hoy, cookies de analítica de terceros,
        publicidad ni redes sociales.
      </p>

      <h2>Cómo gestionar las cookies</h2>
      <p>
        Puedes eliminar o bloquear las cookies desde la configuración de tu
        navegador. Ten en cuenta que bloquear las cookies técnicas puede
        impedir que puedas iniciar sesión correctamente.
      </p>
    </LegalLayout>
  );
}
