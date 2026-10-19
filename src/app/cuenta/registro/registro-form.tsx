"use client";

import { useActionState, useState } from "react";
import { registrarPaciente, type EstadoRegistro } from "./actions";

/**
 * Formulario de registro de pacientes. Si algo falla (p. ej. las
 * contraseñas no coinciden), conserva lo escrito: solo hay que repetir
 * las contraseñas. La coincidencia se comprueba antes de enviar.
 */
export function RegistroForm({ claim, errorInicial }: { claim?: string; errorInicial?: string }) {
  const [estado, enviar, pendiente] = useActionState<EstadoRegistro, FormData>(registrarPaciente, {
    error: errorInicial,
  });
  const [errorLocal, setErrorLocal] = useState<string | null>(null);
  const v = estado.valores;
  const mensaje = errorLocal ?? estado.error;

  function comprobar(e: React.FormEvent<HTMLFormElement>) {
    const datos = new FormData(e.currentTarget);
    if (datos.get("password") !== datos.get("password2")) {
      e.preventDefault();
      setErrorLocal("Las contraseñas no coinciden. Revísalas: el resto de datos se mantiene.");
      return;
    }
    setErrorLocal(null);
  }

  return (
        <form action={enviar} onSubmit={comprobar} className="mt-6 flex flex-col gap-4">
          {claim && <input type="hidden" name="claim" value={claim} />}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="nombre" className="text-sm font-medium text-ink">
                Nombre
              </label>
              <input
                id="nombre"
                name="nombre"
                defaultValue={v?.nombre}
                required
                className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-teal/30"
              />
            </div>
            <div>
              <label
                htmlFor="apellidos"
                className="text-sm font-medium text-ink"
              >
                Apellidos
              </label>
              <input
                id="apellidos"
                name="apellidos"
                defaultValue={v?.apellidos}
                className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-teal/30"
              />
            </div>
          </div>

          <div>
            <label htmlFor="email" className="text-sm font-medium text-ink">
              Email
            </label>
            <input
              id="email"
              name="email"
                defaultValue={v?.email}
              type="email"
              required
              autoComplete="email"
              className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-teal/30"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="telefono"
                className="text-sm font-medium text-ink"
              >
                Teléfono
              </label>
              <input
                id="telefono"
                name="telefono"
                defaultValue={v?.telefono}
                className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-teal/30"
              />
            </div>
            <div>
              <label htmlFor="edad" className="text-sm font-medium text-ink">
                Edad
              </label>
              <input
                id="edad"
                name="edad"
                defaultValue={v?.edad}
                type="number"
                min="18"
                max="100"
                className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-teal/30"
              />
            </div>
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

          <label className="flex items-start gap-2 text-sm text-ink-soft">
            <input
              type="checkbox"
              name="mayor_edad"
              defaultChecked={Boolean(v)}
              required
              className="mt-0.5 h-4 w-4 shrink-0 accent-teal"
            />
            <span>Soy mayor de 18 años</span>
          </label>

          {mensaje && (
            <p role="alert" className="text-sm text-error">
              {mensaje}
            </p>
          )}

          <button
            type="submit"
            disabled={pendiente}
            className="mt-2 rounded-lg bg-teal px-4 py-2 text-sm font-medium text-paper transition hover:bg-teal-dark disabled:opacity-60"
          >
            {pendiente ? "Creando cuenta…" : "Crear cuenta"}
          </button>
        </form>
  );
}
