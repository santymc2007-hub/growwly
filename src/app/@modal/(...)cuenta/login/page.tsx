import { Modal } from "@/components/auth/modal";
import { LoginPacienteForm } from "@/components/auth/forms/login-paciente-form";

type SearchParams = { error?: string; claim?: string };

export default async function LoginPacienteModal({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { error, claim } = await searchParams;

  return (
    <Modal variant="paciente">
      <LoginPacienteForm error={error} claim={claim} />
    </Modal>
  );
}
