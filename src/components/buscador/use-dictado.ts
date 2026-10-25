"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

/**
 * Dictado por voz con la Web Speech API del navegador (Chrome, Edge,
 * Safari; Firefox no la tiene y el botón no se enseña). El audio lo
 * transcribe el propio navegador: Growwly no recibe ni guarda la voz,
 * solo el texto, igual que si se hubiera escrito.
 */

type Reconocedor = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((e: { resultIndex: number; results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
};

function crearReconocedor(): Reconocedor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: new () => Reconocedor;
    webkitSpeechRecognition?: new () => Reconocedor;
  };
  const Clase = w.SpeechRecognition ?? w.webkitSpeechRecognition;
  return Clase ? new Clase() : null;
}

const nada = () => () => {};

/** `texto`: lo que ya hay en el campo (se dicta a continuación). */
export function useDictado(texto: string, onTexto: (texto: string) => void) {
  const soportado = useSyncExternalStore(
    nada,
    () => "SpeechRecognition" in window || "webkitSpeechRecognition" in window,
    () => false,
  );
  const [escuchando, setEscuchando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const rec = useRef<Reconocedor | null>(null);
  const ops = useRef({ textoActual: () => texto, onTexto });
  useEffect(() => {
    ops.current = { textoActual: () => texto, onTexto };
  });

  useEffect(() => () => rec.current?.abort(), []);

  const parar = useCallback(() => {
    rec.current?.stop();
  }, []);

  const empezar = useCallback(() => {
    const r = crearReconocedor();
    if (!r) return;
    rec.current?.abort();
    rec.current = r;
    setError(null);

    const base = ops.current.textoActual().trim();
    let definitivo = "";

    r.lang = "es-ES";
    r.interimResults = true;
    r.continuous = true;
    r.onresult = (e) => {
      let provisional = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const frase = e.results[i][0].transcript;
        if (e.results[i].isFinal) definitivo += frase;
        else provisional += frase;
      }
      const dicho = (definitivo + provisional).trim();
      const unido = base ? `${base} ${dicho}` : dicho.charAt(0).toUpperCase() + dicho.slice(1);
      ops.current.onTexto(unido.slice(0, 600));
    };
    r.onerror = (e) => {
      if (e.error === "not-allowed" || e.error === "service-not-allowed") {
        setError("Permite el uso del micrófono en tu navegador para dictar.");
      } else if (e.error === "no-speech") {
        setError("No te hemos oído. Toca el micrófono y vuelve a intentarlo.");
      } else if (e.error !== "aborted") {
        setError("No hemos podido usar el micrófono. Puedes escribirlo.");
      }
    };
    r.onend = () => setEscuchando(false);

    try {
      r.start();
      setEscuchando(true);
    } catch {
      setEscuchando(false);
    }
  }, []);

  return { soportado, escuchando, error, empezar, parar };
}
