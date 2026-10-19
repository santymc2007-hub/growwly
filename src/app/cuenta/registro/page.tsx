import Link from "next/link";
import { BotonGoogle } from "@/components/auth/boton-google";
import { RegistroForm } from "./registro-form";
import { AuthCard } from "@/components/auth/auth-card";

type SearchParams = { error?: string; claim?: string };

export default async function RegistroPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { error, claim } = await searchParams;

  return (
    <AuthCard variant="paciente">
      <h1 className="mt-2 font-display text-2xl text-teal-dark">
        Crea tu cuenta
      </h1>
      <p className="mt-1 text-sm text-ink-soft">
        {claim
          ? "Un último paso para ver tu análisis capilar."
          : "Para guardar tu análisis y pedir presupuesto a clínicas."}
      </p>

      <BotonGoogle claim={claim} origen="registro" />

      <RegistroForm claim={claim} errorInicial={error ? decodeURIComponent(error) : undefined} />

      <p className="mt-6 text-center text-sm text-ink-soft">
        ¿Ya tienes cuenta?{" "}
        <Link
          href={claim ? `/cuenta/login?claim=${claim}` : "/cuenta/login"}
          className="font-medium text-cyan hover:text-cyan-dark"
        >
          Inicia sesión
        </Link>
      </p>
    </AuthCard>
  );
}
