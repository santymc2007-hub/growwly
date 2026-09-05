"use client";

import { useFormStatus } from "react-dom";

export function BotonAnalizar() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="press mt-6 w-full rounded-full bg-gradient-to-r from-yellow to-orange px-6 py-4 font-display text-base font-bold text-teal-dark shadow-lg shadow-orange/20 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
    >
      {pending
        ? "Subiendo y analizando tus fotos… puede tardar un momento"
        : "Analizar mis fotos"}
    </button>
  );
}
