import Link from "next/link";
import { Mail } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Cabecera común del área de paciente: se ve igual en "Mi cuenta", en
 * un análisis y en una solicitud, para que el paciente no pierda el
 * contexto al entrar en el detalle. A la derecha, el saludo (cerrar
 * sesión vive en el menú principal).
 */
export async function CabeceraCuenta({ userId, email }: { userId: string; email: string | null }) {
  const supabase = await createClient();
  const [{ data: profile }, { data: solicitudes }] = await Promise.all([
    supabase.from("profiles").select("nombre").eq("id", userId).maybeSingle(),
    supabase.from("solicitudes_presupuesto").select("id").eq("user_id", userId),
  ]);

  // RLS de leads_clinica es solo para el backend: el recuento de
  // propuestas pendientes necesita el cliente admin.
  let propuestasNuevas = 0;
  if (solicitudes && solicitudes.length > 0) {
    const { count } = await createAdminClient()
      .from("leads_clinica")
      .select("id", { count: "exact", head: true })
      .in(
        "solicitud_id",
        solicitudes.map((s) => s.id),
      )
      .eq("estado", "propuesta_enviada")
      .is("propuesta_vista_en", null);
    propuestasNuevas = count ?? 0;
  }

  const nombre = profile?.nombre?.trim() || null;
  const inicial = (nombre ?? email ?? "?").charAt(0).toUpperCase();

  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <Link href="/cuenta" className="group flex items-center gap-3">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-teal font-display text-lg font-bold text-paper">
          {inicial}
        </span>
        <span className="flex flex-col">
          <span className="flex items-center gap-2">
            <span className="font-display text-2xl text-teal-dark group-hover:text-teal">Mi cuenta</span>
            {propuestasNuevas > 0 && (
              <span className="flex items-center gap-1 rounded-full bg-cyan/15 px-2.5 py-1 text-xs font-bold text-cyan-dark">
                <Mail className="h-3.5 w-3.5" aria-hidden />
                {propuestasNuevas} {propuestasNuevas === 1 ? "propuesta nueva" : "propuestas nuevas"}
              </span>
            )}
          </span>
          <span className="mt-1 text-sm text-ink-soft">{email}</span>
        </span>
      </Link>
      {nombre && (
        <p className="font-display text-xl font-bold text-teal-dark">
          Hola, {nombre}
        </p>
      )}
    </div>
  );
}
