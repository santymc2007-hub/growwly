import { Modal } from "@/components/auth/modal";
import { RegistroPacienteForm } from "@/components/auth/forms/registro-paciente-form";

type SearchParams = { error?: string; claim?: string };

export default async function RegistroPacienteModal({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { error, claim } = await searchParams;

  return (
    <Modal variant="paciente">
      <RegistroPacienteForm error={error} claim={claim} />
    </Modal>
  );
}
