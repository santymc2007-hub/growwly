import type { Metadata } from "next";
import "@fontsource/poppins/500.css";
import "@fontsource/poppins/600.css";
import "@fontsource/poppins/700.css";
import "@fontsource/montserrat/400.css";
import "@fontsource/montserrat/500.css";
import "@fontsource/montserrat/600.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Growwly — Directorio de clínicas capilares en España",
  description:
    "Encuentra y compara clínicas capilares en España: injertos y tratamientos, ubicación, técnicas, idiomas y financiación.",
};

export default function RootLayout({
  children,
  modal,
}: Readonly<{
  children: React.ReactNode;
  modal: React.ReactNode;
}>) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-paper font-sans text-ink">
        {children}
        {modal}
      </body>
    </html>
  );
}
