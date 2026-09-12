"use client";

import { useFormStatus } from "react-dom";

export function BotonAnalizar() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="press mt-6 w-full rounded-full bg-ink px-7 py-4 font-display text-sm font-bold uppercase tracking-wide text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
    >
      {pending
        ? "Subiendo y analizando tus fotos… puede tardar un momento"
        : "Analizar mis fotos"}
    </button>
  );
}
