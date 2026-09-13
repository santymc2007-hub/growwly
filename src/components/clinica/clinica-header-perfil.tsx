import Image from "next/image";

export function ClinicaHeaderPerfil({
  nombreClinica,
  fotoPrincipal,
  email,
  nombreGestor,
}: {
  nombreClinica: string;
  fotoPrincipal: string | null;
  email: string;
  nombreGestor?: string | null;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        {fotoPrincipal ? (
          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full border-2 border-white shadow">
            <Image src={fotoPrincipal} alt="" fill sizes="56px" className="object-cover" />
          </div>
        ) : (
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-sage text-lg font-bold text-sage-ink">
            {nombreClinica.charAt(0)}
          </div>
        )}
        <div>
          <h1 className="font-display text-2xl text-teal-dark">{nombreClinica}</h1>
          <p className="mt-0.5 text-sm text-ink-soft">{email}</p>
        </div>
      </div>

      {nombreGestor && (
        <p className="text-sm text-ink-soft sm:text-right">
          Bienvenido,{" "}
          <span className="font-display font-bold text-teal-dark">
            {nombreGestor}
          </span>
        </p>
      )}
    </div>
  );
}
