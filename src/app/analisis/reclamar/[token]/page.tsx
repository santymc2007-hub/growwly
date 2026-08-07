import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { reclamarEstudio } from "@/lib/estudios/reclamar-estudio";

type Params = { token: string };

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
