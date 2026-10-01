"use client";

import { useEffect } from "react";

/**
 * Revela con un fundido + subida suave los elementos marcados al entrar
 * en pantalla, una sola vez:
 *   - data-reveal          → el propio elemento
 *   - data-reveal-grupo    → cada hijo directo, en cascada
 *
 * Los elementos que entran a la vez se escalonan entre sí (--i), así una
 * fila de tarjetas aparece una detrás de otra y no todas de golpe.
 * Un MutationObserver recoge lo que se pinta después (navegación entre
 * páginas, cambio lista/mapa, filtros).
 *
 * Todo el CSS depende de la clase "anim" en <html> — ver
 * src/lib/animaciones.ts para apagarlo.
 */
const SELECTOR = "[data-reveal], [data-reveal-grupo] > *";
const MAX_ESCALON = 6;

export function RevealObserver() {
  useEffect(() => {
    const raiz = document.documentElement;
    raiz.dataset.animReady = "1";
    if (!raiz.classList.contains("anim")) return;

    const observados = new WeakSet<Element>();

    const io = new IntersectionObserver(
      (entries) => {
        const entrando = entries
          .filter((e) => e.isIntersecting)
          .sort(
            (a, b) =>
              a.boundingClientRect.top - b.boundingClientRect.top ||
              a.boundingClientRect.left - b.boundingClientRect.left,
          );
        entrando.forEach((entry, i) => {
          const el = entry.target as HTMLElement;
          el.style.setProperty("--i", String(Math.min(i, MAX_ESCALON)));
          el.classList.add("rv-on");
          io.unobserve(el);
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0 },
    );

    const escanear = () => {
      document.querySelectorAll(SELECTOR).forEach((el) => {
        if (observados.has(el) || el.classList.contains("rv-on")) return;
        observados.add(el);
        io.observe(el);
      });
    };

    escanear();
    let pendiente = 0;
    const mo = new MutationObserver(() => {
      cancelAnimationFrame(pendiente);
      pendiente = requestAnimationFrame(escanear);
    });
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      io.disconnect();
      mo.disconnect();
      cancelAnimationFrame(pendiente);
    };
  }, []);

  return null;
}
