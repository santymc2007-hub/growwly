import type { Metadata } from "next";
import "@fontsource/geist/400.css";
import "@fontsource/geist/500.css";
import "@fontsource/geist/600.css";
import "@fontsource/bricolage-grotesque/600.css";
import "@fontsource/bricolage-grotesque/700.css";
import "@fontsource/bricolage-grotesque/800.css";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://growwly-theta.vercel.app";

// ⚠️ NOINDEX TEMPORAL — la web todavía no está lista para lanzar.
// Cuando Santy confirme que ya se puede indexar de verdad, borrar este
// bloque "robots" (o ponerlo a index:true, follow:true) y avisarme para
// hacer lo mismo en robots.ts.
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  robots: {
    index: false,
    follow: false,
  },
  title: {
    default: "Growwly — Directorio de clínicas capilares en España",
    template: "%s | Growwly",
  },
  description:
    "Encuentra y compara clínicas capilares en España: injertos y tratamientos, ubicación, técnicas, idiomas y financiación.",
  openGraph: {
    siteName: "Growwly",
    type: "website",
    locale: "es_ES",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-paper font-sans text-ink">
        {children}
      </body>
    </html>
  );
}
