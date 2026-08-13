import { CallbackClient } from "../callback/callback-client";

type SearchParams = { next?: string };

export default async function AuthCallbackClientePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { next } = await searchParams;
  return <CallbackClient next={next ?? "/cuenta"} />;
}
