import { OlvidePasswordForm } from "@/components/auth/olvide-password-form";

type SearchParams = { error?: string; enviado?: string };

export default async function OlvidePasswordPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { error, enviado } = await searchParams;
  return <OlvidePasswordForm seccion="admin" error={error} enviado={enviado} />;
}
