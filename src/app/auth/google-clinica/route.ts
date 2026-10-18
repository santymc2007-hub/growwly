import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Vuelta de "Continuar con Google" desde /clinica/login (pasa antes
 * por /auth/callback, que crea la sesión). Hace la misma comprobación
 * de rol que el login con contraseña: solo entran cuentas de clínica.
 *
 * Si el email de Google coincide con el de una cuenta de clínica ya
 * existente, Supabase vincula las dos identidades y la cuenta es la
 * misma. Si no existía ninguna cuenta con ese email, Supabase la acaba
 * de crear como paciente: se borra (recién creada, solo con Google y
 * sin datos) para no dejar cuentas fantasma, y se explica cómo entrar.
 *
 * Route Handler (no página) porque tiene que poder borrar cookies al
 * cerrar la sesión.
 */
export async function GET(request: Request) {
  const { origin } = new URL(request.url);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const aLogin = (ruta: string, mensaje: string) =>
    NextResponse.redirect(`${origin}${ruta}?error=${encodeURIComponent(mensaje)}`);

  if (!user) {
    return aLogin("/clinica/login", "No se ha podido iniciar sesión con Google. Inténtalo de nuevo.");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role === "clinic") {
    return NextResponse.redirect(`${origin}/clinica`);
  }

  await supabase.auth.signOut();

  if (profile?.role === "admin") {
    return aLogin("/admin/login", "Esta cuenta es de administrador. Inicia sesión aquí.");
  }

  // Cuenta de paciente: ¿la acaba de crear este mismo intento?
  const soloGoogle =
    (user.identities ?? []).length > 0 &&
    (user.identities ?? []).every((i) => i.provider === "google");
  const recienCreada = Date.now() - new Date(user.created_at).getTime() < 10 * 60 * 1000;

  if (soloGoogle && recienCreada) {
    const admin = createAdminClient();
    const [{ count: estudios }, { count: solicitudes }] = await Promise.all([
      admin
        .from("estudios_capilares")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id),
      admin
        .from("solicitudes_presupuesto")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id),
    ]);
    if (!estudios && !solicitudes) {
      await admin.auth.admin.deleteUser(user.id);
    }
    return aLogin(
      "/clinica/login",
      "No hay ninguna clínica registrada con ese email de Google. Entra con tu email y contraseña o regístrate como clínica.",
    );
  }

  return aLogin("/cuenta/login", "Esta cuenta es de paciente. Inicia sesión aquí.");
}
