"use client";

import { useState } from "react";

type Props = {
  action: (formData: FormData) => void;
  triggerLabel: string;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  triggerClassName?: string;
};

export function ConfirmButton({
  action,
  triggerLabel,
  title,
  message,
  confirmLabel = "Sí, eliminar",
  cancelLabel = "No, cancelar",
  triggerClassName = "text-sm font-medium text-ink-soft hover:text-error",
}: Props) {
  const [abierto, setAbierto] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className={triggerClassName}
      >
        {triggerLabel}
      </button>

      {abierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
          <button
            type="button"
            aria-label="Cerrar"
            onClick={() => setAbierto(false)}
            className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
          />
          <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <p className="font-display text-lg text-teal-dark">{title}</p>
            <p className="mt-2 text-sm text-ink-soft">{message}</p>
            <div className="mt-6 flex gap-3">
              <form action={action} className="flex-1">
                <button
                  type="submit"
                  className="w-full rounded-full bg-error px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
                >
                  {confirmLabel}
                </button>
              </form>
              <button
                type="button"
                onClick={() => setAbierto(false)}
                className="flex-1 rounded-full border border-line px-4 py-2.5 text-sm font-medium text-ink-soft transition hover:bg-paper-dim"
              >
                {cancelLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
