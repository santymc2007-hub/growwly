import Image from "next/image";
import Link from "next/link";
import { LeadDetalle } from "@/components/leads/lead-detalle";

type Params = { token: string };

export default async function LeadPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { token } = await params;

  return (
    <main className="flex-1">
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-6 py-3">
          <Image
            src="/brand/growwly-logo-gradient.png"
            alt="Growwly"
            width={102}
            height={35}
            className="h-8 w-auto"
          />
          <Link
            href="/clinica/solicitudes"
            className="text-sm font-medium text-cyan-dark hover:text-teal-dark"
          >
            ← Volver a solicitudes
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-6 py-12">
        <LeadDetalle token={token} />
      </div>
    </main>
  );
}
