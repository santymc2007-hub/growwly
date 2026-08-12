import { RestablecerPasswordForm } from "@/components/auth/restablecer-password-form";

type SearchParams = { error?: string };

export default async function RestablecerPasswordPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { error } = await searchParams;
  return <RestablecerPasswordForm seccion="cuenta" error={error} />;
}
