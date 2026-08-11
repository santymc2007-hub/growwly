import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SiteHeader } from "@/components/site-header";
import { ClinicaNav } from "../clinica-nav";
import { guardarDatosFacturacion } from "./actions";

type SearchParams = { guardado?: string };

export default async function FacturacionPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { guardado } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/clinica/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, clinic_id, clinic_status")
    .eq("id", user.id)
    .maybeSingle();

  if (
    !profile ||
    profile.role !== "clinic" ||
    profile.clinic_status !== "aprobado" ||
    !profile.clinic_id
  ) {
    redirect("/clinica");
  }

  const { data: clinic } = await supabase
    .from("clinics")
    .select("nombre, datos_facturacion")
    .eq("id", profile.clinic_id)
    .maybeSingle();

  if (!clinic) {
    notFound();
  }

  const datos =
    clinic.datos_facturacion && typeof clinic.datos_facturacion === "object"
      ? (clinic.datos_facturacion as {
          titular?: string;
          nif_cif?: string;
          email_facturacion?: string;
        })
      : {};

  const inputClass =
    "mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-teal/30";

  return (
    <main className="flex-1 bg-gradient-to-b from-sage/25 to-transparent">
      <SiteHeader />
      <div className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="font-display text-2xl text-teal-dark">
          {clinic.nombre}
        </h1>

        <div className="mt-8">
          <ClinicaNav activo="facturacion" />
        </div>

        <div className="mb-6 rounded-2xl border border-line bg-white p-4 text-sm text-ink-soft">
          Estos datos son solo de <strong className="text-ink">referencia
          para facturarte</strong> — no guardamos ningún dato de pago (ni
          tarjeta, ni cuenta bancaria) aquí. Cuando Growwly incorpore pagos
          online, se harán siempre a través de una pasarela de pago segura,
          nunca almacenados directamente por nosotros.
        </div>

        {guardado && (
          <p className="mb-4 rounded-lg bg-sage px-4 py-3 text-sm text-sage-ink">
            Datos guardados.
          </p>
        )}

        <form
          action={guardarDatosFacturacion}
          className="max-w-md rounded-2xl border border-line bg-white p-5"
        >
          <div>
            <label htmlFor="titular" className="text-sm font-medium text-ink">
              Titular / razón social
            </label>
            <input
              id="titular"
              name="titular"
              defaultValue={datos.titular ?? ""}
              className={inputClass}
            />
          </div>
          <div className="mt-4">
            <label htmlFor="nif_cif" className="text-sm font-medium text-ink">
              NIF / CIF
            </label>
            <input
              id="nif_cif"
              name="nif_cif"
              defaultValue={datos.nif_cif ?? ""}
              className={inputClass}
            />
          </div>
          <div className="mt-4">
            <label
              htmlFor="email_facturacion"
              className="text-sm font-medium text-ink"
            >
              Email de facturación
            </label>
            <input
              id="email_facturacion"
              name="email_facturacion"
              type="email"
              defaultValue={datos.email_facturacion ?? ""}
              className={inputClass}
            />
          </div>

          <button
            type="submit"
            className="mt-6 rounded-full bg-teal px-6 py-3 text-sm font-medium text-paper transition hover:bg-teal-dark"
          >
            Guardar
          </button>
        </form>
      </div>
    </main>
  );
}
