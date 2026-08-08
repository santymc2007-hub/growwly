"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import Image from "next/image";

const ETIQUETA: Record<"clinica" | "paciente" | "admin", string> = {
  clinica: "GROWWLY PARA CLÍNICAS",
  paciente: "GROWWLY",
  admin: "GROWWLY ADMIN",
};

export function Modal({
  variant,
  children,
}: {
  variant: "clinica" | "paciente" | "admin";
  children: ReactNode;
}) {
  const router = useRouter();

  function cerrar() {
    router.back();
  }

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") cerrar();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-6 py-12">
      <button
        type="button"
        aria-label="Cerrar"
        onClick={cerrar}
        className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
      />
      <div className="relative w-full max-w-sm rounded-2xl bg-white p-8 shadow-2xl">
        <button
          type="button"
          onClick={cerrar}
          aria-label="Cerrar"
          className="absolute right-4 top-4 text-ink-soft hover:text-ink"
        >
          ✕
        </button>
        <Image
          src="/brand/growwly-logo-light-bg.png"
          alt="Growwly"
          width={130}
          height={33}
          className="h-7 w-auto"
        />
        <p className="mt-4 text-xs font-medium uppercase tracking-[0.2em] text-ink-soft">
          {ETIQUETA[variant]}
        </p>
        {children}
      </div>
    </div>
  );
}
