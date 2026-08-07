import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { SiteHeader } from "@/components/site-header";
import { SolicitudWizard } from "./solicitud-wizard";

export default async function NuevaSolicitudPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/cuenta/login");
  }

  const [{ data: profile }, { data: estudios }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    supabase
      .from("estudios_capilares")
      .select("id, created_at, norwood_estimado, estado")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
  ]);

  return (
    <main className="flex-1">
      <SiteHeader />

      <div className="mx-auto max-w-xl px-6 py-12">
        <Link
          href="/cuenta"
          className="text-sm font-medium text-cyan hover:text-cyan-dark"
        >
          ← Volver a mi cuenta
        </Link>

        <h1 className="mt-4 font-display text-2xl text-teal-dark">
          Solicitar presupuesto
        </h1>
        <p className="mt-2 text-sm text-ink-soft">
          Cuéntanos un poco más sobre tu caso — con esto, las clínicas
          podrán hacerte una propuesta ajustada de verdad.
        </p>

        <div className="mt-8">
          <SolicitudWizard profile={profile ?? null} estudios={estudios ?? []} />
        </div>
      </div>
    </main>
  );
}
