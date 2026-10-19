"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { trackEvent } from "@/lib/analytics/events";
import { entrarConGoogle } from "@/app/cuenta/google/actions";
import {
  enviarCodigoValoracion,
  verificarCodigoValoracion,
  type EstadoDesbloqueo,
} from "./actions";

const inputClase =
  "h-12 w-full rounded-xl border border-[#c9d6d2] bg-white px-4 text-base text-ink outline-none transition focus:border-cyan-dark focus:ring-2 focus:ring-cyan/30";

/**
 * Formulario del adelanto de la valoración: nombre + email → código de
 * acceso → valoración completa, sin salir de la página. El enlace del
 * mismo email también sirve (pasa por /analisis/reclamar/[token]).
 */
export function DesbloquearValoracion({
  token,
  emailInicial,
  nombreInicial,
}: {
  token: string;
  emailInicial?: string | null;
  nombreInicial?: string | null;
}) {
  const router = useRouter();
  const inicial: EstadoDesbloqueo = {
    paso: "datos",
    email: emailInicial ?? "",
    nombre: nombreInicial ?? "",
  };

  const [estadoEnvio, enviar, enviando] = useActionState(enviarCodigoValoracion, inicial);
  const [estadoCodigo, verificar, verificando] = useActionState(verificarCodigoValoracion, inicial);

  // Tras enviar el código se pasa a la pantalla del código; si el envío
  // (o el reenvío) falla, se vuelve a los datos con el error.
  const datosCodigo = estadoEnvio.paso === "codigo" ? estadoEnvio : null;
  const enCodigo = datosCodigo !== null;

  const emailMedido = useRef(false);
  useEffect(() => {
    if (estadoEnvio.paso === "codigo" && !emailMedido.current) {
      emailMedido.current = true;
      // Sin parámetros: a analítica y anuncios solo les llega que ha dejado el email.
      trackEvent("valoracion_email");
    }
    if (estadoEnvio.paso === "listo") router.push(estadoEnvio.destino);
  }, [estadoEnvio, router]);

  useEffect(() => {
    if (estadoCodigo.paso === "listo") {
      trackEvent("sign_up", { metodo: "codigo_email", tipo_cuenta: "paciente" });
      router.push(estadoCodigo.destino);
    }
  }, [estadoCodigo, router]);

  if (enCodigo && datosCodigo) {
    const errorCodigo = estadoCodigo.paso === "codigo" ? estadoCodigo.error : undefined;
    return (
      <div className="flex flex-col gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-sage">
          <svg aria-hidden width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-sage-ink">
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <path d="m3 7 9 6 9-6" />
          </svg>
        </div>
        <h2 className="font-display text-2xl font-extrabold text-teal-dark sm:text-[26px]">
          Revisa tu email
        </h2>
        <p className="text-[15px] leading-relaxed text-ink-soft">
          Te hemos enviado un código a{" "}
          <strong className="font-semibold text-ink">{datosCodigo.email}</strong>. Escríbelo aquí
          para ver tu valoración completa.
        </p>

        <form action={verificar} className="flex flex-col gap-3">
          <input type="hidden" name="token" value={token} />
          <input type="hidden" name="email" value={datosCodigo.email} />
          <input type="hidden" name="nombre" value={datosCodigo.nombre} />
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            Código
            <input
              name="codigo"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9 ]*"
              maxLength={10}
              required
              autoFocus
              placeholder="000000"
              className={`${inputClase} h-14 text-center font-display text-2xl font-extrabold tracking-[0.4em] text-teal-dark placeholder:text-line`}
            />
          </label>
          {errorCodigo && (
            <p role="alert" className="text-sm text-error-dark">
              {errorCodigo}
            </p>
          )}
          <button
            type="submit"
            disabled={verificando}
            className="press mt-1 h-14 rounded-full bg-yellow font-display text-lg font-extrabold text-teal-dark shadow-lg shadow-yellow/30 transition hover:opacity-90 disabled:opacity-60"
          >
            {verificando ? "Comprobando…" : "Ver mi valoración →"}
          </button>
        </form>

        <p className="text-[13px] leading-relaxed text-ink-soft">
          También puedes pulsar el botón del email: te trae aquí con todo desbloqueado. ¿No lo ves?
          Mira en Promociones o Spam.
        </p>

        <div className="flex items-center justify-between gap-3 text-sm">
          <form action={enviar}>
            <input type="hidden" name="token" value={token} />
            <input type="hidden" name="email" value={datosCodigo.email} />
            <input type="hidden" name="nombre" value={datosCodigo.nombre} />
            <input type="hidden" name="reenviar" value="1" />
            <button type="submit" disabled={enviando} className="font-medium text-cyan-dark hover:text-teal-dark disabled:opacity-60">
              {enviando ? "Enviando…" : datosCodigo.reenviado ? "Código reenviado ✓" : "Reenviar código"}
            </button>
          </form>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="font-medium text-cyan-dark hover:text-teal-dark"
          >
            Cambiar email
          </button>
        </div>
      </div>
    );
  }

  const errorDatos = estadoEnvio.paso === "datos" ? estadoEnvio.error : undefined;
  const valores = estadoEnvio.paso === "datos" ? estadoEnvio : inicial;

  return (
    <div className="flex flex-col gap-4">
      <form action={enviar} className="flex flex-col gap-3">
        <input type="hidden" name="token" value={token} />
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          Nombre
          <input
            name="nombre"
            autoComplete="given-name"
            required
            maxLength={80}
            defaultValue={valores.nombre}
            placeholder="Tu nombre"
            className={inputClase}
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          Email
          <input
            name="email"
            type="email"
            autoComplete="email"
            required
            defaultValue={valores.email}
            placeholder="tu@email.com"
            className={inputClase}
          />
        </label>
        {errorDatos && (
          <p role="alert" className="text-sm text-error-dark">
            {errorDatos}
          </p>
        )}
        <button
          type="submit"
          disabled={enviando}
          className="press mt-1 h-14 rounded-full bg-yellow font-display text-lg font-extrabold text-teal-dark shadow-lg shadow-yellow/30 transition hover:opacity-90 disabled:opacity-60"
        >
          {enviando ? "Enviando código…" : "Crear mi cuenta gratis →"}
        </button>
      </form>

      <div className="flex items-center gap-3 text-[13px] text-ink-soft">
        <span className="h-px flex-1 bg-line" />o<span className="h-px flex-1 bg-line" />
      </div>

      <form action={entrarConGoogle}>
        <input type="hidden" name="claim" value={token} />
        <input type="hidden" name="origen" value="registro" />
        <input type="hidden" name="area" value="paciente" />
        <button
          type="submit"
          className="press flex h-[52px] w-full items-center justify-center gap-2.5 rounded-full border border-[#c9d6d2] bg-white font-semibold text-ink transition hover:bg-[#f8f9fa]"
        >
          <svg viewBox="0 0 48 48" className="h-[18px] w-[18px]" aria-hidden>
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
          </svg>
          Continuar con Google
        </button>
      </form>

      <p className="text-xs leading-relaxed text-ink-soft">
        Te enviamos un código para entrar, sin contraseñas. Al crear tu cuenta aceptas los{" "}
        <a href="/legal/terminos" className="underline hover:text-teal-dark">
          Términos
        </a>{" "}
        y la{" "}
        <a href="/legal/privacidad" className="underline hover:text-teal-dark">
          Política de privacidad
        </a>
        . Usamos tu email para tu cuenta, tu valoración y avisos sobre ella.
      </p>
    </div>
  );
}
