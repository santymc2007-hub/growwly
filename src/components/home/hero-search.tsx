"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

type HeroSearchProps = {
  ciudades: string[];
  tecnicas: string[];
};

export function HeroSearch({ ciudades, tecnicas }: HeroSearchProps) {
  const router = useRouter();
  const [tecnica, setTecnica] = useState("");
  const [ciudad, setCiudad] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (tecnica) params.set("tecnica", tecnica);
    if (ciudad) params.set("ciudad", ciudad);
    const query = params.toString();
    router.push(query ? `/clinicas?${query}` : "/clinicas");
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto flex max-w-2xl flex-col gap-3 rounded-2xl bg-white p-3 text-left shadow-lg sm:flex-row sm:items-center sm:gap-0"
    >
      <div className="flex-1 px-3 py-1">
        <label
          htmlFor="hero-tecnica"
          className="block text-xs font-medium text-ink-soft"
        >
          ¿Qué tratamiento buscas?
        </label>
        <select
          id="hero-tecnica"
          value={tecnica}
          onChange={(e) => setTecnica(e.target.value)}
          className="w-full border-none bg-transparent p-0 text-sm text-ink focus:outline-none focus:ring-0"
        >
          <option value="">Cualquier tratamiento</option>
          {tecnicas.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      <div className="hidden h-8 w-px bg-line sm:block" />

      <div className="flex-1 px-3 py-1">
        <label
          htmlFor="hero-ciudad"
          className="block text-xs font-medium text-ink-soft"
        >
          ¿Dónde?
        </label>
        <select
          id="hero-ciudad"
          value={ciudad}
          onChange={(e) => setCiudad(e.target.value)}
          className="w-full border-none bg-transparent p-0 text-sm text-ink focus:outline-none focus:ring-0"
        >
          <option value="">Cualquier ciudad</option>
          {ciudades.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <button
        type="submit"
        className="rounded-xl bg-cyan px-6 py-3 text-sm font-medium text-white transition hover:bg-cyan-dark"
      >
        Buscar clínicas
      </button>
    </form>
  );
}
