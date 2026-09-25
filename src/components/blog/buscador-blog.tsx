import { Search } from "lucide-react";

/** Buscador simple del blog — GET a /blog?q=... (sin JS, funciona con SSR). */
export function BuscadorBlog({ query }: { query?: string }) {
  return (
    <form action="/blog" method="GET" className="flex gap-2">
      <input
        type="search"
        name="q"
        defaultValue={query ?? ""}
        placeholder="Buscar en el blog…"
        className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-teal/30"
      />
      <button
        type="submit"
        aria-label="Buscar"
        className="shrink-0 rounded-lg bg-teal px-3 text-paper transition hover:bg-teal-dark"
      >
        <Search className="h-4 w-4" aria-hidden />
      </button>
    </form>
  );
}
