"use client";

import { useState } from "react";
import { Mail, Plus, X } from "lucide-react";

const MAX = 3;

type Props = {
  /** Emails ya guardados para recibir leads. */
  iniciales: string[];
  /** Email de la ficha: se usa si no hay ninguno propio. */
  emailFicha: string | null;
};

/**
 * Hasta 3 emails que reciben los avisos de leads (valoraciones y
 * peticiones de información). Cada input se llama "emails_leads", así
 * que la Server Action los lee con formData.getAll().
 */
export function EmailsLeadsField({ iniciales, emailFicha }: Props) {
  const [emails, setEmails] = useState<string[]>(
    iniciales.length > 0 ? iniciales.slice(0, MAX) : [""],
  );

  function cambiar(i: number, valor: string) {
    setEmails((prev) => prev.map((e, j) => (j === i ? valor : e)));
  }
  function quitar(i: number) {
    setEmails((prev) => (prev.length === 1 ? [""] : prev.filter((_, j) => j !== i)));
  }
  function anadir() {
    setEmails((prev) => (prev.length < MAX ? [...prev, ""] : prev));
  }

  const sinNinguno = emails.every((e) => e.trim() === "");

  return (
    <div className="rounded-2xl border border-line bg-paper-dim/60 p-4">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-teal">
          <Mail className="h-4 w-4" strokeWidth={2} aria-hidden />
        </span>
        <div>
          <p className="text-sm font-medium text-ink">Emails para recibir solicitudes</p>
          <p className="mt-0.5 text-xs text-ink-soft">
            Aquí te avisamos de cada valoración y petición de información de
            pacientes. Puedes poner hasta {MAX} (recepción, médico,
            coordinador…). No se muestran en tu ficha.
          </p>
        </div>
      </div>

      <div className="mt-3 flex flex-col gap-2">
        {emails.map((email, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              type="email"
              name="emails_leads"
              value={email}
              onChange={(e) => cambiar(i, e.target.value)}
              placeholder={i === 0 ? "recepcion@tuclinica.com" : "otro@tuclinica.com"}
              aria-label={`Email para solicitudes ${i + 1}`}
              autoComplete="off"
              className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-teal/30"
            />
            {(emails.length > 1 || email.trim() !== "") && (
              <button
                type="button"
                onClick={() => quitar(i)}
                aria-label="Quitar este email"
                className="press flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-ink-soft hover:bg-white hover:text-error"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            )}
          </div>
        ))}
      </div>

      {emails.length < MAX && (
        <button
          type="button"
          onClick={anadir}
          className="press mt-2 inline-flex items-center gap-1.5 rounded-lg px-1 py-1 text-sm font-medium text-cyan-dark hover:underline"
        >
          <Plus className="h-4 w-4" aria-hidden />
          Añadir otro email
        </button>
      )}

      {sinNinguno && (
        <p className="mt-2 text-xs text-ink-soft">
          {emailFicha
            ? `Si lo dejas vacío, los avisos llegan a ${emailFicha}.`
            : "Si lo dejas vacío y no hay email en tu ficha, no podremos avisarte de las solicitudes."}
        </p>
      )}
    </div>
  );
}
