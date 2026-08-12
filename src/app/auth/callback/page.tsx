import { CallbackClient } from "./callback-client";

type SearchParams = { code?: string; next?: string };

export default async function AuthCallbackPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { code, next } = await searchParams;
  return <CallbackClient code={code} next={next ?? "/cuenta"} />;
}
