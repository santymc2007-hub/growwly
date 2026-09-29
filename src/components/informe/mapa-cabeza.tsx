import type { InformeCapilar, Intensidad } from "@/lib/informe/tipos";

export const COLOR_INTENSIDAD: Record<Intensidad, string> = {
  conservada: "#cfebdc",
  leve: "#e8ef2d",
  moderada: "#ffba1f",
  marcada: "#f08a24",
};

const ETIQUETA_INTENSIDAD: Record<Intensidad, string> = {
  conservada: "Conservada",
  leve: "Leve",
  moderada: "Moderada",
  marcada: "Marcada",
};

// Posiciones fijas para dibujar placas (areata) o focos de irritación:
// la IA dice cuántas hay, no dónde, así que se reparten de forma creíble.
const PLACAS: [number, number, number][] = [
  [120, 170, 24],
  [205, 262, 30],
  [205, 140, 20],
  [122, 258, 22],
  [165, 208, 18],
  [232, 196, 16],
];
const FOCOS: [number, number, number][] = [
  [140, 150, 9],
  [190, 160, 11],
  [165, 195, 8],
  [118, 190, 7],
  [212, 200, 7],
];

/**
 * Vista superior de la cabeza con cada zona coloreada según la
 * intensidad que ha visto la IA. Es un esquema, no una foto: sirve para
 * que el paciente entienda de un vistazo dónde está la pérdida.
 */
export function MapaCabeza({
  informe,
  mostrarDonante,
}: {
  informe: InformeCapilar;
  mostrarDonante: boolean;
}) {
  const z = informe.zonas;
  const esAreata = informe.flujo === "alopecia_areata";
  const esCuero = informe.flujo === "cuero_cabelludo";
  const conRaya = z.raya !== "conservada";
  const numPlacas = esAreata ? Math.min(PLACAS.length, informe.placas ?? 1) : 0;

  const usadas = Array.from(
    new Set<Intensidad>(
      esAreata ? ["conservada"] : [z.entradas, z.frontal, z.media, z.coronilla, z.raya],
    ),
  ).sort(
    (a, b) =>
      ["conservada", "leve", "moderada", "marcada"].indexOf(a) -
      ["conservada", "leve", "moderada", "marcada"].indexOf(b),
  );

  return (
    <div className="flex flex-col gap-4">
      <svg
        viewBox="0 0 330 410"
        className="mx-auto h-auto w-full max-w-[290px]"
        role="img"
        aria-label="Esquema de la cabeza vista desde arriba con las zonas coloreadas según lo que se ve en tus fotos"
      >
        <text x="165" y="16" textAnchor="middle" fontSize="12" fontWeight="600" letterSpacing="1.5" fill="#66756f">
          FRENTE
        </text>
        <ellipse cx="165" cy="210" rx="135" ry="178" fill={esAreata ? COLOR_INTENSIDAD.conservada : "#eef6f1"} stroke="#1f5568" strokeWidth="2" />
        {!esAreata && (
          <>
            <path d="M62 118 Q82 62 128 46 Q116 92 98 132 Z" fill={COLOR_INTENSIDAD[z.entradas]} stroke="#fff" strokeWidth="2" />
            <path d="M268 118 Q248 62 202 46 Q214 92 232 132 Z" fill={COLOR_INTENSIDAD[z.entradas]} stroke="#fff" strokeWidth="2" />
            <path d="M128 46 Q165 34 202 46 Q210 82 204 104 Q165 94 126 104 Q120 82 128 46 Z" fill={COLOR_INTENSIDAD[z.frontal]} stroke="#fff" strokeWidth="2" />
            <ellipse cx="165" cy="172" rx="74" ry="48" fill={COLOR_INTENSIDAD[z.media]} stroke="#fff" strokeWidth="2" />
            <circle cx="165" cy="250" r="52" fill={COLOR_INTENSIDAD[z.coronilla]} stroke="#fff" strokeWidth="2" />
            {conRaya && (
              <>
                <ellipse cx="165" cy="185" rx="34" ry="118" fill={COLOR_INTENSIDAD[z.raya]} />
                <line x1="165" y1="62" x2="165" y2="300" stroke="#1f5568" strokeWidth="1.5" strokeDasharray="4 5" />
              </>
            )}
          </>
        )}
        {mostrarDonante && (
          <>
            <path d="M50 292 Q165 420 280 292" fill="none" stroke="#61c5f1" strokeWidth="26" strokeLinecap="round" opacity="0.55" />
            <path d="M50 292 Q165 420 280 292" fill="none" stroke="#1f5568" strokeWidth="1.5" strokeDasharray="5 5" />
          </>
        )}
        {PLACAS.slice(0, numPlacas).map(([cx, cy, r], i) => (
          <circle key={`p${i}`} cx={cx} cy={cy} r={r} fill={COLOR_INTENSIDAD.marcada} stroke="#fff" strokeWidth="2" />
        ))}
        {esCuero &&
          FOCOS.map(([cx, cy, r], i) => (
            <circle key={`f${i}`} cx={cx} cy={cy} r={r} fill={COLOR_INTENSIDAD.marcada} stroke="#fff" strokeWidth="2" />
          ))}
        {!esAreata && !conRaya && (
          <>
            <text x="165" y="176" textAnchor="middle" fontSize="13" fontWeight="600" fill="#1f5568">Zona media</text>
            <text x="165" y="255" textAnchor="middle" fontSize="13" fontWeight="600" fill="#1f5568">Coronilla</text>
          </>
        )}
        {mostrarDonante && (
          <text x="165" y="382" textAnchor="middle" fontSize="12" fontWeight="600" fill="#1f5568">Zona donante</text>
        )}
        <text x="165" y="404" textAnchor="middle" fontSize="12" fontWeight="600" letterSpacing="1.5" fill="#66756f">
          NUCA
        </text>
      </svg>

      <ul className="grid grid-cols-2 gap-x-3 gap-y-2.5 text-[13px] text-ink">
        {usadas.map((i) => (
          <li key={i} className="flex items-center gap-2">
            <span className="h-3.5 w-3.5 shrink-0 rounded" style={{ background: COLOR_INTENSIDAD[i] }} />
            {esAreata ? "Densidad normal" : esCuero && i !== "conservada" ? "Descamación" : ETIQUETA_INTENSIDAD[i]}
          </li>
        ))}
        {(esAreata || esCuero) && (
          <li className="flex items-center gap-2">
            <span className="h-3.5 w-3.5 shrink-0 rounded" style={{ background: COLOR_INTENSIDAD.marcada }} />
            {esAreata ? "Placa sin pelo" : "Rojez"}
          </li>
        )}
        {mostrarDonante && (
          <li className="flex items-center gap-2">
            <span className="h-3.5 w-3.5 shrink-0 rounded border-[1.5px] border-dashed border-teal-dark bg-[#b0e0f5]" />
            Zona donante
          </li>
        )}
      </ul>
    </div>
  );
}
