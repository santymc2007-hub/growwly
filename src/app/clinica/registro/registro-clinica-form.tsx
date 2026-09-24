"use client";

import { useState } from "react";

type ClinicaDisponible = { id: string; nombre: string; ciudad: string | null };
type Modo = "existente" | "nueva";

export function RegistroClinicaForm({
  action,
  clinicasDisponibles,
  clinicPreseleccionada,
  modoInicial,
  error,
}: {
  action: (formData: FormData) => void;
  clinicasDisponibles: ClinicaDisponible[];
  clinicPreseleccionada: string;
  modoInicial: Modo;
  error: string | null;
}) {
  const [modo, setModo] = useState<Modo>(modoInicial);

  return (
    <>
      <div className="inline-flex w-full rounded-full border border-line bg-paper-dim p-1">
        <button
          type="button"
          onClick={() => setModo("existente")}
          className={`flex-1 rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
            modo === "existente"
              ? "bg-teal-dark text-white"
              : "text-ink-soft hover:text-teal-dark"
          }`}
        >
          Reclamar clínica
        </button>
        <button
          type="button"
          onClick={() => setModo("nueva")}
          className={`flex-1 rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
            modo === "nueva"
              ? "bg-teal-dark text-white"
              : "text-ink-soft hover:text-teal-dark"
          }`}
        >
          Clínica nueva
        </button>
      </div>

      <form action={action} className="mt-6 flex flex-col gap-4">
        <input type="hidden" name="modo" value={modo} />

        {modo === "existente" ? (
          <div>
            <label htmlFor="clinic_id" className="text-sm font-medium text-ink">
              Tu clínica
            </label>
            <select
              id="clinic_id"
              name="clinic_id"
              required
              defaultValue={clinicPreseleccionada}
              className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-teal/30"
            >
              <option value="" disabled>
                Selecciona tu clínica
              </option>
              {clinicasDisponibles.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre} {c.ciudad ? `(${c.ciudad})` : ""}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-ink-soft">
              ¿No aparece tu clínica en la lista? Pulsa &quot;Clínica
              nueva&quot; arriba.
            </p>
          </div>
        ) : (
          <div>
            <label htmlFor="nombre_clinica" className="text-sm font-medium text-ink">
              Nombre de tu clínica
            </label>
            <input
              id="nombre_clinica"
              name="nombre_clinica"
              placeholder="Ej. Clínica Capilar Mediterráneo"
              required
              className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-teal/30"
            />
            <p className="mt-1 text-xs text-ink-soft">
              El nombre de la clínica es como se verá en su ficha — será el
              título de la página. Sé lo más conciso y preciso posible.
            </p>
          </div>
        )}

        <div>
          <label htmlFor="nombre_gestor" className="text-sm font-medium text-ink">
            Tu nombre y apellido
          </label>
          <input
            id="nombre_gestor"
            name="nombre_gestor"
            placeholder="Ej. María García"
            required
            className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-teal/30"
          />
        </div>

        <div>
          <label htmlFor="email" className="text-sm font-medium text-ink">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-teal/30"
          />
        </div>

        <div>
          <label htmlFor="password" className="text-sm font-medium text-ink">
            Contraseña
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="new-password"
            className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-teal/30"
          />
        </div>

        <div>
          <label htmlFor="password2" className="text-sm font-medium text-ink">
            Repite la contraseña
          </label>
          <input
            id="password2"
            name="password2"
            type="password"
            required
            autoComplete="new-password"
            className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-teal/30"
          />
        </div>

        {error && <p className="text-sm text-error">{error}</p>}

        <button
          type="submit"
          className="mt-2 rounded-lg bg-teal px-4 py-2 text-sm font-medium text-paper transition hover:bg-teal-dark"
        >
          {modo === "existente" ? "Solicitar acceso" : "Crear mi clínica"}
        </button>
      </form>
    </>
  );
}
