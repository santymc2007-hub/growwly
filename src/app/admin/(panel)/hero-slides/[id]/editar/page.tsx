import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { updateSlide } from "../../actions";
import { HeroSlideForm } from "../../hero-slide-form";

type Params = { id: string };
type SearchParams = { error?: string };

export default async function EditarSlidePage({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<SearchParams>;
}) {
  const { id } = await params;
  const { error } = await searchParams;

  const supabase = await createClient();
  const { data: slide } = await supabase
    .from("hero_slides")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!slide) {
    notFound();
  }

  const actionConId = updateSlide.bind(null, id);

  return (
    <div>
      <h1 className="font-display text-2xl text-teal-dark">Editar slide</h1>
      <div className="mt-6">
        <HeroSlideForm action={actionConId} slide={slide} error={error} />
      </div>
    </div>
  );
}
