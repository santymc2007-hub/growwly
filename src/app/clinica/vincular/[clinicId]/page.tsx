import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { vincularClinica } from "@/lib/clinica/vincular-clinica";

type Params = { clinicId: string };
type SearchParams = { nombre?: string; nueva?: string };

export default async function VincularClinicaPage({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<SearchParams>;
}) {
  const { clinicId } = await params;
  // `nueva` ya no decide nada (se ignora): la autoaprobación se
  // comprueba en el servidor dentro de vincularClinica().
  const { nombre } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/clinica/login");
  }

  await vincularClinica(user.id, clinicId, nombre, { emailUsuario: user.email });
  redirect("/clinica");
}
