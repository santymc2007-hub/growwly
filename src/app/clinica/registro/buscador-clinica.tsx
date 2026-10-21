"use client";

import { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";

type Clinica = { id: string; nombre: string; ciudad: string | null };

/**
 * Campo "Tu clínica" de Reclamar clínica: se escribe el nombre y salen
 * las fichas publicadas y sin gestor que coinciden (antes era un
 * desplegable con todas, inviable con cientos de centros). El id elegido
 * va en un input oculto `clinic_id`.
 */
export function BuscadorClinica({
  inicial,
  onNoAparece,
}: {
  /** Ficha ya elegida (p. ej. desde "Reclama este centro" en la ficha). */
  inicial: Clinica | null;
  /** "¿No aparece?": pasa a Clínica nueva con el texto escrito. */
  onNoAparece: (textoEscrito: string) => void;
}) {
  const [elegida, setElegida] = useState<Clinica | null>(inicial);
  const [texto, setTexto] = useState("");
  const [resultados, setResultados] = useState<Clinica[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [abierto, setAbierto] = useState(false);
  const [activo, setActivo] = useState(0);
  const contenedor = useRef<HTMLDivElement>(null);

  // Búsqueda con un pequeño retardo para no lanzar una petición por tecla.
  useEffect(() => {
    const q = texto.trim();
    if (q.length < 2) return;
    const controlador = new AbortController();
    const t = setTimeout(async () => {
      setBuscando(true);
      try {
        const r = await fetch(`/api/clinicas/reclamables?q=${encodeURIComponent(q)}`, {
          signal: controlador.signal,
        });
        const json = (await r.json()) as { resultados: Clinica[] };
        setResultados(json.resultados);
        setActivo(0);
      } catch {
        // Petición cancelada o sin red: se deja la lista anterior.
      } finally {
        setBuscando(false);
      }
    }, 200);
    return () => {
      clearTimeout(t);
      controlador.abort();
    };
  }, [texto]);

  useEffect(() => {
    function fuera(e: MouseEvent) {
      if (contenedor.current && !contenedor.current.contains(e.target as Node)) setAbierto(false);
    }
    document.addEventListener("mousedown", fuera);
    return () => document.removeEventListener("mousedown", fuera);
  }, []);

  function elegir(c: Clinica) {
    setElegida(c);
    setAbierto(false);
    setTexto("");
    setResultados([]);
  }

  const hayTexto = texto.trim().length >= 2;
  const lista = hayTexto ? resultados : [];

  if (elegida) {
    return (
      <div>
        <input type="hidden" name="clinic_id" value={elegida.id} />
        <div className="mt-1 flex items-center justify-between gap-3 rounded-lg border border-teal/40 bg-sage/30 px-3 py-2.5 text-sm">
          <span className="min-w-0">
            <span className="font-semibold text-ink">{elegida.nombre}</span>
            {elegida.ciudad && <span className="text-ink-soft"> · {elegida.ciudad}</span>}
          </span>
          <button
            type="button"
            onClick={() => setElegida(null)}
            className="flex shrink-0 items-center gap-1 text-xs font-semibold text-cyan-dark hover:underline"
          >
            <X className="h-3.5 w-3.5" aria-hidden />
            Cambiar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div ref={contenedor} className="relative">
      {/* Sin clínica elegida, el campo oculto va vacío y el formulario no
          deja enviar (ver el aviso de abajo). */}
      <input type="hidden" name="clinic_id" value="" />
      <div className="relative mt-1">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft"
          aria-hidden
        />
        <input
          id="buscar_clinica"
          // Mientras no se elija una ficha de la lista, el campo no es
          // válido: el navegador avisa en vez de enviar sin clínica.
          ref={(el) => el?.setCustomValidity("Elige tu clínica de la lista o pulsa «Clínica nueva».")}
          type="text"
          role="combobox"
          aria-expanded={abierto && hayTexto}
          aria-controls="sugerencias-clinica"
          aria-autocomplete="list"
          autoComplete="off"
          value={texto}
          required
          onChange={(e) => {
            setTexto(e.target.value);
            setAbierto(true);
          }}
          onFocus={() => setAbierto(true)}
          onKeyDown={(e) => {
            if (!lista.length) return;
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setActivo((a) => Math.min(a + 1, lista.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActivo((a) => Math.max(a - 1, 0));
            } else if (e.key === "Enter") {
              e.preventDefault();
              elegir(lista[activo]);
            }
          }}
          placeholder="Escribe el nombre de tu clínica"
          className="w-full rounded-lg border border-line bg-white py-2 pl-9 pr-3 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-teal/30"
        />
      </div>

      {abierto && hayTexto && (
        <ul
          id="sugerencias-clinica"
          role="listbox"
          className="popover-anim absolute left-0 right-0 z-30 mt-1 max-h-72 overflow-auto rounded-xl border border-line bg-white p-1 shadow-lg"
        >
          {lista.map((c, i) => (
            <li key={c.id} role="option" aria-selected={i === activo}>
              <button
                type="button"
                onMouseEnter={() => setActivo(i)}
                onClick={() => elegir(c)}
                className={`flex w-full items-baseline justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm ${
                  i === activo ? "bg-paper-dim" : ""
                }`}
              >
                <span className="font-medium text-ink">{c.nombre}</span>
                {c.ciudad && <span className="shrink-0 text-xs text-ink-soft">{c.ciudad}</span>}
              </button>
            </li>
          ))}
          {!buscando && lista.length === 0 && (
            <li className="px-3 py-2 text-sm text-ink-soft">
              No encontramos ninguna clínica con ese nombre pendiente de reclamar.
            </li>
          )}
          <li className="mt-1 border-t border-line pt-1">
            <button
              type="button"
              onClick={() => onNoAparece(texto.trim())}
              className="w-full rounded-lg px-3 py-2 text-left text-sm font-semibold text-cyan-dark hover:bg-paper-dim"
            >
              ¿No aparece? Dar de alta «{texto.trim()}» como clínica nueva →
            </button>
          </li>
        </ul>
      )}
    </div>
  );
}
