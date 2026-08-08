import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Todo lo que cuelga de /cuenta es para pacientes. Si quien ha iniciado
 * sesión es en realidad una cuenta de admin o de clínica, lo mandamos a
 * su sitio en vez de enseñarle una página de paciente vacía. A los
 * visitantes sin sesión no los tocamos aquí — cada página protegida ya
 * hace su propio "si no hay usuario, a login", y /cuenta/login y
 * /cuenta/registro tienen que poder verse sin sesión.
 */
export default async function CuentaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.role === "admin") {
      redirect("/admin/clinicas");
    }
    if (profile?.role === "clinic") {
      redirect("/clinica");
    }
  }

  return <>{children}</>;
}
