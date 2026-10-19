import { requireAdmin } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { prepararEmailReclamo } from "@/lib/admin/email-reclamo";

/** Vista previa (solo admin) del email "reclama tu ficha" de un centro, con sus datos reales. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const preparado = await prepararEmailReclamo(createAdminClient(), id);
  if ("error" in preparado) return new Response(preparado.error, { status: 404 });
  return new Response(preparado.html, {
    headers: { "Content-Type": "text/html; charset=utf-8", "X-Robots-Tag": "noindex" },
  });
}
