import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { registrarClinica } from "./actions";
import { AuthCard } from "@/components/auth/auth-card";
import { RegistroClinicaForm } from "./registro-clinica-form";

type SearchParams = { error?: string; clinic?: string; modo?: string };

export default async function RegistroClinicaPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { error, clinic, modo } = await searchParams;

  const supabase = await createClient();
  const { data: todasLasClinicas } = await supabase
    .from("clinics")
    .select("id, nombre, ciudad")
    .order("nombre", { ascending: true });

  const { data: aprobadas } = await supabase
    .from("profiles")
    .select("clinic_id")
    .eq("role", "clinic")
    .eq("clinic_status", "aprobado");

  const idsReclamados = new Set((aprobadas ?? []).map((p) => p.clinic_id));
  const clinicasDisponibles = (todasLasClinicas ?? []).filter(
    (c) => !idsReclamados.has(c.id),
  );

  return (
    <AuthCard variant="clinica">
      <h1 className="mt-2 font-display text-2xl text-teal-dark">
        Tu clínica en Growwly
      </h1>
      <p className="mt-1 text-sm text-ink-soft">
        Reclama la ficha de tu clínica si ya está en el directorio, o crea una
        nueva si todavía no aparece. Tu cuenta quedará pendiente de
        aprobación antes de activarse.
      </p>

      <div className="mt-8">
        <RegistroClinicaForm
          action={registrarClinica}
          clinicasDisponibles={clinicasDisponibles}
          clinicPreseleccionada={clinic ?? ""}
          modoInicial={modo === "nueva" ? "nueva" : "existente"}
          error={error ? decodeURIComponent(error) : null}
        />
      </div>

      <p className="mt-6 text-center text-sm text-ink-soft">
        ¿Ya tienes cuenta?{" "}
        <Link
          href="/clinica/login"
          className="font-medium text-cyan hover:text-cyan-dark"
        >
          Inicia sesión
        </Link>
      </p>
    </AuthCard>
  );
}
