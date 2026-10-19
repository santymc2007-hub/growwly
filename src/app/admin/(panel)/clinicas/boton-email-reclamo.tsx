"use client";

import { useState, useTransition } from "react";
import { Mail, MailCheck, MailX } from "lucide-react";
import type { EstadoReclamo } from "@/lib/admin/email-reclamo";
import { enviarEmailReclamo } from "./acciones-email-reclamo";

const TITULO: Record<EstadoReclamo, string> = {
  "sin-email": "Sin email: no se puede enviar",
  "con-cuenta": "Ya tiene cuenta: no hace falta",
  baja: "Pidió no recibir más emails",
  pendiente: "Enviar email para reclamar la ficha",
  enviado: "Email enviado",
};

function fecha(iso: string) {
  return new Date(iso).toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit" });
}

/**
 * Icono de sobre de cada centro en /admin/clinicas. Abre una
 * confirmación en la propia tabla (vista previa, enviar, cancelar):
 * nunca se envía con un solo clic.
 */
export function BotonEmailReclamo({
  clinicId,
  email,
  estado: estadoInicial,
  enviadoEn: enviadoInicial,
}: {
  clinicId: string;
  email: string | null;
  estado: EstadoReclamo;
  enviadoEn: string | null;
}) {
  const [estado, setEstado] = useState(estadoInicial);
  const [enviadoEn, setEnviadoEn] = useState(enviadoInicial);
  const [abierto, setAbierto] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const bloqueado = estado === "sin-email" || estado === "con-cuenta" || estado === "baja";
  const Icono = estado === "enviado" ? MailCheck : estado === "baja" ? MailX : Mail;

  function enviar() {
    setError(null);
    startTransition(async () => {
      const r = await enviarEmailReclamo(clinicId);
      if (r.ok) {
        setEstado("enviado");
        setEnviadoEn(r.enviadoEn);
        setAbierto(false);
      } else {
        setError(r.error);
      }
    });
  }

  return (
    <div className="relative inline-flex items-center">
      <button
        type="button"
        title={estado === "enviado" && enviadoEn ? `Enviado el ${fecha(enviadoEn)}` : TITULO[estado]}
        aria-label={TITULO[estado]}
        disabled={bloqueado}
        onClick={() => setAbierto((v) => !v)}
        className={`inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-xs font-medium ${
          bloqueado
            ? "cursor-not-allowed text-ink-soft/40"
            : estado === "enviado"
              ? "text-sage-ink hover:bg-sage/40"
              : "text-teal hover:bg-sage/40"
        }`}
      >
        <Icono className="h-4 w-4" aria-hidden />
        {estado === "enviado" && enviadoEn && <span>{fecha(enviadoEn)}</span>}
      </button>

      {abierto && !bloqueado && (
        <div className="absolute right-0 top-full z-20 mt-1 w-72 rounded-xl border border-line bg-white p-4 text-left shadow-lg">
          <p className="text-sm font-semibold text-ink">
            {estado === "enviado" ? "¿Reenviar el email?" : "¿Enviar el email para reclamar la ficha?"}
          </p>
          <p className="mt-1 break-all text-xs text-ink-soft">Se enviará a {email}</p>
          {estado === "enviado" && enviadoEn && (
            <p className="mt-1 text-xs text-ink-soft">Ya se envió el {fecha(enviadoEn)}.</p>
          )}
          {error && <p className="mt-2 text-xs text-error-dark">{error}</p>}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={enviar}
              disabled={pending}
              className="rounded-lg bg-teal px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-dark disabled:opacity-60"
            >
              {pending ? "Enviando…" : estado === "enviado" ? "Reenviar" : "Enviar"}
            </button>
            <a
              href={`/admin/clinicas/${clinicId}/email-reclamo`}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg border border-line px-3 py-1.5 text-xs font-medium text-ink hover:bg-paper-dim"
            >
              Vista previa
            </a>
            <button
              type="button"
              onClick={() => setAbierto(false)}
              className="px-1 text-xs text-ink-soft hover:text-ink"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
