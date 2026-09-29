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

      <h2>¿Qué son las cookies?</h2>
      <p>
        Las cookies son pequeños archivos que se almacenan en tu navegador
        al visitar un sitio web.
      </p>

      <h2>Cookies técnicas o necesarias</h2>
      <p>
        Growwly utiliza <strong>cookies técnicas o necesarias</strong>,
        imprescindibles para el funcionamiento del sitio:
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

      <h2>Cookies analíticas</h2>
      <p>
        Utilizamos <strong>Google Analytics</strong> para entender cómo se
        usa Growwly (páginas visitadas, procedencia del tráfico) y así poder
        mejorar el sitio. Estas cookies solo se instalan si nos das tu
        consentimiento expreso en el aviso que aparece al entrar en la web,
        y anonimizamos la dirección IP antes de enviarla a Google.
      </p>
      <p>
        Puedes aceptar o rechazar estas cookies en cualquier momento desde
        el enlace <strong>&quot;Preferencias de cookies&quot;</strong> al pie
        de cualquier página.
      </p>

      <h2>Cookies que no usamos</h2>
      <p>
        Growwly no utiliza, a día de hoy, cookies de publicidad ni de redes
        sociales.
      </p>

      <h2>Cómo gestionar las cookies</h2>
      <p>
        Además de nuestro panel de preferencias, puedes eliminar o bloquear
        las cookies desde la configuración de tu navegador. Ten en cuenta
        que bloquear las cookies técnicas puede impedir que puedas iniciar
        sesión correctamente.
      </p>
    </LegalLayout>
  );
}
