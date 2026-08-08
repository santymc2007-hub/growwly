import { createPost } from "../actions";
import { BlogForm } from "../blog-form";

type SearchParams = { error?: string };

export default async function NuevaEntradaPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { error } = await searchParams;

  return (
    <div>
      <h1 className="font-display text-2xl text-teal-dark">Nueva entrada</h1>
      <div className="mt-6">
        <BlogForm action={createPost} error={error} />
      </div>
    </div>
  );
}
