"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { comprobarProgreso, type Progreso } from "../actions";

const CADA_MS = 15000;

/**
 * Mientras Apify busca, pregunta cada 15 s cómo va. Al terminar carga
 * los resultados, avisa (título de la pestaña + notificación del
 * navegador si se permitió) y refresca la página.
 */
export function Seguimiento({ id, provincia, inicio }: { id: string; provincia: string; inicio: string }) {
  const router = useRouter();
  const [progreso, setProgreso] = useState<Progreso | null>(null);
  const [ahora, setAhora] = useState(() => Date.now());
  const [permiso, setPermiso] = useState<NotificationPermission | "no">("no");
  const tituloOriginal = useRef<string | null>(null);

  useEffect(() => {
    tituloOriginal.current = document.title;
  }, []);

  useEffect(() => {
    const t = setInterval(() => setAhora(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    let vivo = true;
    let espera: ReturnType<typeof setTimeout>;
    const vuelta = async () => {
      const p = await comprobarProgreso(id);
      if (!vivo) return;
      setProgreso(p);
      if (typeof Notification !== "undefined") setPermiso(Notification.permission);
      if (p.estado === "en_curso") {
        if (tituloOriginal.current) document.title = `⏳ ${p.encontrados} · ${provincia}`;
        espera = setTimeout(vuelta, CADA_MS);
        return;
      }
      const texto =
        p.estado === "cargada" ? `${provincia}: ${p.total} centros listos para revisar` : `${provincia}: la búsqueda falló`;
      document.title = p.estado === "cargada" ? `✓ ${texto}` : `✗ ${texto}`;
      try {
        if (typeof Notification !== "undefined" && Notification.permission === "granted") {
          new Notification("Growwly · Importar provincia", { body: texto });
        }
      } catch {
        /* algunos navegadores no permiten notificaciones aquí */
      }
      router.refresh();
    };
    vuelta();
    return () => {
      vivo = false;
      clearTimeout(espera);
      if (tituloOriginal.current) document.title = tituloOriginal.current;
    };
  }, [id, provincia, router]);

  const minutos = Math.max(0, Math.floor((ahora - new Date(inicio).getTime()) / 60000));
  const terminado = progreso && progreso.estado !== "en_curso";

  return (
    <div className="mt-6 rounded-2xl border border-line bg-white p-5">
      {progreso?.estado === "fallida" ? (
        <p className="text-sm text-error-dark">{progreso.mensaje}</p>
      ) : (
        <>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="font-medium text-ink">
              {terminado ? "Búsqueda terminada. Cargando resultados…" : "Apify está buscando centros…"}
            </p>
            <p className="text-sm text-ink-soft">
              {progreso?.estado === "en_curso" ? `${progreso.encontrados} encontrados · ` : ""}
              {minutos} min
            </p>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-paper-dim">
            <div className="barra-indeterminada h-full w-1/3 rounded-full bg-yellow" />
          </div>
          {progreso?.estado === "en_curso" && progreso.mensaje && (
            <p className="mt-2 truncate text-xs text-ink-soft">{progreso.mensaje}</p>
          )}
          <p className="mt-3 text-xs text-ink-soft">
            Suele tardar entre 5 y 30 minutos. Puedes dejar esta pestaña abierta y seguir con otra cosa: se
            actualiza sola y la pestaña cambia a «✓» al terminar.
          </p>
          {permiso === "default" && (
            <button
              type="button"
              onClick={async () => setPermiso(await Notification.requestPermission())}
              className="mt-3 rounded-full border border-line px-4 py-1.5 text-xs font-medium text-ink hover:bg-paper-dim"
            >
              Avisarme con una notificación al terminar
            </button>
          )}
          {permiso === "granted" && (
            <p className="mt-3 text-xs text-ink-soft">Te llegará una notificación del navegador al terminar.</p>
          )}
        </>
      )}
      <style>{`
        .barra-indeterminada { animation: barra-ind 1.6s cubic-bezier(0.65, 0, 0.35, 1) infinite; }
        @keyframes barra-ind { 0% { transform: translateX(-100%); } 100% { transform: translateX(300%); } }
        @media (prefers-reduced-motion: reduce) { .barra-indeterminada { animation: none; width: 100%; opacity: .5; } }
      `}</style>
    </div>
  );
}
