import { Modal } from "@/components/auth/modal";
import { LoginAdminForm } from "@/components/auth/forms/login-admin-form";

type SearchParams = { error?: string };

export default async function LoginAdminModal({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { error } = await searchParams;

  return (
    <Modal variant="admin">
      <LoginAdminForm error={error} />
    </Modal>
  );
}
