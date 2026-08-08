import { Modal } from "@/components/auth/modal";
import { LoginClinicaForm } from "@/components/auth/forms/login-clinica-form";

type SearchParams = { error?: string };

export default async function LoginClinicaModal({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { error } = await searchParams;

  return (
    <Modal variant="clinica">
      <LoginClinicaForm error={error} />
    </Modal>
  );
}
