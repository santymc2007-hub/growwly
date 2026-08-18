import { createSlide } from "../actions";
import { HeroSlideForm } from "../hero-slide-form";

type SearchParams = { error?: string };

export default async function NuevaSlidePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { error } = await searchParams;

  return (
    <div>
      <h1 className="font-display text-2xl text-teal-dark">Nueva slide</h1>
      <div className="mt-6">
        <HeroSlideForm action={createSlide} error={error} />
      </div>
    </div>
  );
}
