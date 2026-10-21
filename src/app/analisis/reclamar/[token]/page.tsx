import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { reclamarEstudio } from "@/lib/estudios/reclamar-estudio";

type Params = { token: string };

// Página privada con token: nunca se indexa.
export const metadata: Metadata = {
  title: "Tu valoración capilar",
  robots: { index: false, follow: false },
};

export default async function ReclamarEstudioPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { token } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/cuenta/login?claim=${token}`);
  }

  const estudioId = await reclamarEstudio(user.id, token);

  if (estudioId) {
    redirect(`/cuenta/analisis/${estudioId}`);
  }

  redirect("/cuenta");
}
