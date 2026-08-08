import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { registrarClinica } from "@/app/clinica/registro/actions";

export async function RegistroClinicaForm({ error }: { error?: string }) {
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
    <>
      <h1 className="mt-2 font-display text-2xl text-teal-dark">
        Reclama tu clínica
      </h1>
      <p className="mt-1 text-sm text-ink-soft">
        Regístrate para ver y responder a las solicitudes de presupuesto de
        tu clínica. Tu cuenta quedará pendiente de aprobación antes de
        activarse.
      </p>

      <form action={registrarClinica} className="mt-8 flex flex-col gap-4">
        <div>
          <label htmlFor="clinic_id" className="text-sm font-medium text-ink">
            Tu clínica
          </label>
          <select
            id="clinic_id"
            name="clinic_id"
            required
            defaultValue=""
            className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-teal/30"
          >
            <option value="" disabled>
              Selecciona tu clínica
            </option>
            {clinicasDisponibles.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre} {c.ciudad ? `(${c.ciudad})` : ""}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-ink-soft">
            ¿No aparece tu clínica en el directorio? Escríbenos y la damos de
            alta.
          </p>
        </div>

        <div>
          <label htmlFor="email" className="text-sm font-medium text-ink">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-teal/30"
          />
        </div>

        <div>
          <label htmlFor="password" className="text-sm font-medium text-ink">
            Contraseña
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="new-password"
            className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-teal/30"
          />
        </div>

        <div>
          <label htmlFor="password2" className="text-sm font-medium text-ink">
            Repite la contraseña
          </label>
          <input
            id="password2"
            name="password2"
            type="password"
            required
            autoComplete="new-password"
            className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-teal/30"
          />
        </div>

        {error && (
          <p className="text-sm text-error">{decodeURIComponent(error)}</p>
        )}

        <button
          type="submit"
          className="mt-2 rounded-lg bg-teal px-4 py-2 text-sm font-medium text-paper transition hover:bg-teal-dark"
        >
          Solicitar acceso
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-soft">
        ¿Ya tienes cuenta?{" "}
        <Link
          href="/clinica/login"
          className="font-medium text-cyan hover:text-cyan-dark"
        >
          Inicia sesión
        </Link>
      </p>
    </>
  );
}
