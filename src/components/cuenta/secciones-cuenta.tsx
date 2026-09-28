"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";

export type IdSeccion = "datos" | "analisis" | "presupuestos";

const Ctx = createContext<{
  abierta: IdSeccion | null;
  abrir: (id: IdSeccion | null) => void;
}>({
  abierta: null,
  abrir: () => {},
});

const ES_SECCION = (v: string): v is IdSeccion =>
  ["datos", "analisis", "presupuestos"].includes(v);

/**
 * Secciones de "Mi cuenta" como anclas: solo una abierta a la vez; el
 * resto se quedan plegadas en su cabecera. La sección abierta se guarda
 * en el hash (#analisis…) para poder enlazar directamente a ella.
 */
export function SeccionesCuenta({
  inicial,
  nav,
  children,
}: {
  inicial: IdSeccion;
  nav: { id: IdSeccion; label: string; aviso?: string }[];
  children: React.ReactNode;
}) {
  const [abierta, setAbierta] = useState<IdSeccion | null>(inicial);

  useEffect(() => {
    const leerHash = () => {
      const h = window.location.hash.slice(1);
      if (ES_SECCION(h)) setAbierta(h);
    };
    leerHash();
    window.addEventListener("hashchange", leerHash);
    return () => window.removeEventListener("hashchange", leerHash);
  }, []);

  function abrir(id: IdSeccion | null) {
    setAbierta(id);
    if (id) history.replaceState(null, "", `#${id}`);
  }

  return (
    <Ctx.Provider value={{ abierta, abrir }}>
      <nav
        className="mt-8 flex flex-wrap gap-2"
        aria-label="Secciones de mi cuenta"
      >
        {nav.map((n) => {
          const activa = abierta === n.id;
          return (
            <a
              key={n.id}
              href={`#${n.id}`}
              onClick={(e) => {
                e.preventDefault();
                abrir(n.id);
                document
                  .getElementById(n.id)
                  ?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              aria-current={activa ? "true" : undefined}
              className={`press flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition ${
                activa
                  ? "bg-teal-dark text-white"
                  : "border border-line bg-white text-teal-dark hover:bg-paper-dim"
              }`}
            >
              {n.label}
              {n.aviso && (
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-bold ${activa ? "bg-yellow text-teal-dark" : "bg-cyan/15 text-cyan-dark"}`}
                >
                  {n.aviso}
                </span>
              )}
            </a>
          );
        })}
      </nav>
      <div className="mt-6 flex flex-col gap-4">{children}</div>
    </Ctx.Provider>
  );
}

export function SeccionPlegable({
  id,
  titulo,
  icono,
  resumen,
  acciones,
  children,
}: {
  id: IdSeccion;
  titulo: string;
  icono: React.ReactNode;
  /** Se ve siempre, también plegada (p. ej. "3 análisis"). */
  resumen?: React.ReactNode;
  acciones?: React.ReactNode;
  children: React.ReactNode;
}) {
  const { abierta, abrir } = useContext(Ctx);
  const esAbierta = abierta === id;

  return (
    <section
      id={id}
      className="scroll-mt-6 overflow-hidden rounded-3xl border border-line bg-white"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-5 sm:px-8">
        <button
          type="button"
          onClick={() => abrir(esAbierta ? null : id)}
          aria-expanded={esAbierta}
          aria-controls={`${id}-contenido`}
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-paper-dim text-teal">
            {icono}
          </span>
          <span className="flex flex-col">
            <span className="font-display text-xl font-bold text-teal-dark">
              {titulo}
            </span>
            {resumen && (
              <span className="text-sm text-ink-soft">{resumen}</span>
            )}
          </span>
          <ChevronDown
            className={`ml-auto h-5 w-5 shrink-0 text-ink-soft transition-transform duration-200 ${esAbierta ? "rotate-180" : ""}`}
            aria-hidden
          />
        </button>
        {acciones}
      </div>
      {esAbierta && (
        <div
          id={`${id}-contenido`}
          className="popover-anim border-t border-line px-6 py-6 sm:px-8"
          style={{ transformOrigin: "top" }}
        >
          {children}
        </div>
      )}
    </section>
  );
}
