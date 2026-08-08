import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { vincularClinica } from "@/lib/clinica/vincular-clinica";

type Params = { clinicId: string };

export default async function VincularClinicaPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { clinicId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/clinica/login");
  }

  await vincularClinica(user.id, clinicId);
  redirect("/clinica");
}
