import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { AnnouncementBar } from "@/components/home/announcement-bar";
import { crearEstudio } from "../actions";
import { AnalisisForm } from "./analisis-form";

// Subir varias fotos + analizarlas con IA puede superar los 10s por
// defecto de las funciones de Vercel.
export const maxDuration = 60;

type SearchParams = { error?: string };

export default async function NuevoAnalisisPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { error } = await searchParams;

  return (
    <main className="flex-1">
      <AnnouncementBar />
      <SiteHeader />
      <AnalisisForm action={crearEstudio} initialError={error} />
      <SiteFooter />
    </main>
  );
}
