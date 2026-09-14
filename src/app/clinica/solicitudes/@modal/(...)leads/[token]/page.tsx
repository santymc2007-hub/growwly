import { LeadModal } from "@/components/leads/lead-modal";
import { LeadDetalle } from "@/components/leads/lead-detalle";

type Params = { token: string };

export default async function LeadModalPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { token } = await params;

  return (
    <LeadModal>
      <LeadDetalle token={token} />
    </LeadModal>
  );
}
