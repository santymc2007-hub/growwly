"use client";

import Image from "next/image";
import { useState } from "react";
import { verificarFotoSubida } from "./verificar-action";

type Estado = "vacio" | "comprobando" | "ok" | "aviso" | "error_tecnico";

export function SlotFoto({
  name,
  label,
  hint,
  imagen,
  orientacion,
}: {
  name: string;
  label: string;
  hint: string;
  imagen: string;
  orientacion: string;
}) {
  const [estado, setEstado] = useState<Estado>("vacio");
  const [mensaje, setMensaje] = useState("");

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) {
      setEstado("vacio");
      return;
    }

    setEstado("comprobando");
    setMensaje("");

    try {
      const fd = new FormData();
      fd.append("foto", file);
      fd.append("orientacion", orientacion);
      const resultado = await verificarFotoSubida(fd);

      if (resultado.ok) {
        setEstado("ok");
      } else {
        setEstado("aviso");
        setMensaje(resultado.mensaje);
      }
    } catch {
      // Si la comprobación en sí falla (red, etc.), no bloqueamos —
      // simplemente no mostramos veredicto, la foto sigue adjunta.
      setEstado("error_tecnico");
    }
  }

  return (
    <div className="rounded-2xl border border-line bg-white p-4">
      <div className="flex items-start gap-3">
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-sage/40">
          <Image src={imagen} alt="" fill sizes="64px" className="object-cover" />
        </div>
        <div>
          <label htmlFor={name} className="text-sm font-medium text-ink">
            {label}{" "}
            <span className="font-normal text-ink-soft">
              (recomendable, no obligatoria)
            </span>
          </label>
          <p className="mt-0.5 text-xs text-ink-soft">{hint}</p>
        </div>
      </div>
      <input
        id={name}
        name={name}
        type="file"
        accept="image/*"
        onChange={onChange}
        className="mt-3 block w-full text-xs text-ink-soft file:mr-3 file:rounded-lg file:border-0 file:bg-sage file:px-3 file:py-2 file:text-xs file:font-medium file:text-sage-ink"
      />

      {estado === "comprobando" && (
        <p className="mt-2 flex items-center gap-1.5 text-xs text-cyan-dark">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan" />
          Comprobando la foto…
        </p>
      )}
      {estado === "ok" && (
        <p className="mt-2 text-xs font-medium text-sage-ink">
          ✓ Se ve bien
        </p>
      )}
      {estado === "aviso" && (
        <p className="mt-2 text-xs font-medium text-error-dark">
          ⚠ {mensaje} Puedes subirla igual, o intentar con otra.
        </p>
      )}
    </div>
  );
}
