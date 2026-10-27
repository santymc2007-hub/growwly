/* eslint-disable @next/next/no-img-element */

/** La W de Growwly con las tres estrellas encima, latiendo. */
export function MarcaIA({ tamano = 37 }: { tamano?: number }) {
  // Estrellas un 15 % más grandes y algo más arriba que la W.
  const estrellas = Math.round(tamano * 0.92);
  return (
    <span
      aria-hidden
      className="relative inline-block shrink-0"
      style={{ width: tamano + 6, height: tamano * 0.83 + estrellas * 0.7 }}
    >
      <img
        src="/brand/w-blanca.png"
        alt=""
        width={tamano}
        height={Math.round(tamano * 0.83)}
        className="ia-latido absolute bottom-0 left-[3px]"
        style={{ width: tamano, height: "auto" }}
      />
      <svg
        width={estrellas}
        height={Math.round(estrellas * 0.9)}
        viewBox="0 0 58 52"
        className="absolute"
        style={{ left: Math.round(tamano * 0.15), top: -Math.round(estrellas * 0.2) }}
      >
        <path className="ia-ch1" fill="#b0cf0c" d="M34 2c1.6 9.4 5.8 13.6 15 15.2-9.2 1.6-13.4 5.8-15 15.2-1.6-9.4-5.8-13.6-15-15.2 9.2-1.6 13.4-5.8 15-15.2z" />
        <path className="ia-ch2" fill="#b0cf0c" d="M10 24c.8 4.6 2.8 6.6 7.2 7.4-4.4.8-6.4 2.8-7.2 7.4-.8-4.6-2.8-6.6-7.2-7.4 4.4-.8 6.4-2.8 7.2-7.4z" />
        <path className="ia-ch3" fill="#b0cf0c" d="M24 38c.5 3 1.8 4.3 4.6 4.8-2.8.5-4.1 1.8-4.6 4.8-.5-3-1.8-4.3-4.6-4.8 2.8-.5 4.1-1.8 4.6-4.8z" />
      </svg>
    </span>
  );
}
