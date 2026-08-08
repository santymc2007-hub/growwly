import { Modal } from "@/components/auth/modal";
import { RegistroClinicaForm } from "@/components/auth/forms/registro-clinica-form";

type SearchParams = { error?: string };

export default async function RegistroClinicaModal({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { error } = await searchParams;

  return (
    <Modal variant="clinica">
      <RegistroClinicaForm error={error} />
    </Modal>
  );
}
