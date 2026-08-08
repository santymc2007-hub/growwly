import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { updatePost } from "../../actions";
import { BlogForm } from "../../blog-form";

type Params = { id: string };
type SearchParams = { error?: string };

export default async function EditarEntradaPage({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<SearchParams>;
}) {
  const { id } = await params;
  const { error } = await searchParams;

  const supabase = await createClient();
  const { data: post } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!post) {
    notFound();
  }

  const actionConId = updatePost.bind(null, id);

  return (
    <div>
      <h1 className="font-display text-2xl text-teal-dark">
        Editar entrada
      </h1>
      <div className="mt-6">
        <BlogForm action={actionConId} post={post} error={error} />
      </div>
    </div>
  );
}
