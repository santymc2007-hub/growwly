"use client";

import { useFormStatus } from "react-dom";

export function BotonAnalizar() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-6 w-full rounded-lg bg-teal px-4 py-3 text-sm font-medium text-paper transition hover:bg-teal-dark disabled:opacity-60"
    >
      {pending
        ? "Subiendo y analizando tus fotos… puede tardar un momento"
        : "Analizar mis fotos"}
    </button>
  );
}
