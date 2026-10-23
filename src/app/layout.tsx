import type { Metadata } from "next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { CookieConsent } from "@/components/analytics/cookie-consent";
import { BuscadorIA } from "@/components/buscador/buscador-ia";
import { CapturaAtribucion } from "@/components/analytics/captura-atribucion";
import "@fontsource/geist/400.css";
import "@fontsource/geist/500.css";
import "@fontsource/geist/600.css";
import "@fontsource/bricolage-grotesque/600.css";
import "@fontsource/bricolage-grotesque/700.css";
import "@fontsource/bricolage-grotesque/800.css";
import "./globals.css";
import { RevealObserver } from "@/components/reveal-observer";
import { ANIMACIONES_ACTIVAS, SCRIPT_ANIMACIONES } from "@/lib/animaciones";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.growwly.es";

// Supabase vive en Frankfurt (eu-central-1). Sin esto, Vercel puede
// ejecutar las funciones que renderizan las páginas en EEUU por
// defecto — cada consulta a la base de datos cruzaría el Atlántico ida
// y vuelta. "fra1" pone las funciones a un salto de red de Supabase.
export const preferredRegion = "fra1";

// ⚠️ NOINDEX TEMPORAL — la web todavía no está lista para lanzar.
// Cuando Santy confirme que ya se puede indexar de verdad, borrar este
// bloque "robots" (o ponerlo a index:true, follow:true) y avisarme para
// hacer lo mismo en robots.ts.
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  robots: {
    index: true,
    follow: true,
    // Miniaturas grandes y fragmentos completos en Google y Discover.
    googleBot: { "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 },
  },
  title: {
    default: "Growwly — Directorio de clínicas capilares en España",
    template: "%s | Growwly",
  },
  description:
    "El directorio de clínicas y centros capilares verificados de España — tratamientos, opiniones y precios reales, para hombres y mujeres.",
  openGraph: {
    siteName: "Growwly",
    type: "website",
    locale: "es_ES",
  },
  twitter: {
    card: "summary_large_image",
  },
  // Verificación del dominio en el porfolio empresarial de Meta (no quitar:
  // Meta la revisa periódicamente y, si desaparece, el dominio deja de estar verificado).
  verification: {
    other: {
      "facebook-domain-verification": "bdfnil6njyp1w67lkh1xvssh6c2854",
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // suppressHydrationWarning: el script del <head> añade la clase
    // "anim" antes de que React hidrate — es esperado, no un error.
    <html lang="es" className="h-full antialiased" suppressHydrationWarning>
      {ANIMACIONES_ACTIVAS && (
        <head>
          <script dangerouslySetInnerHTML={{ __html: SCRIPT_ANIMACIONES }} />
        </head>
      )}
      <body className="min-h-full flex flex-col bg-paper font-sans text-ink">
        {children}
        <BuscadorIA />
        {ANIMACIONES_ACTIVAS && <RevealObserver />}
        <CookieConsent />
        <CapturaAtribucion />
        <SpeedInsights />
      </body>
    </html>
  );
}
