"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { PuntoSerie } from "@/lib/clinica/estadisticas-clinica";

export function GraficoLineas({
  datos,
  color = "#00c2d6",
  etiqueta,
}: {
  datos: PuntoSerie[];
  color?: string;
  etiqueta: string;
}) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={datos} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e0" vertical={false} />
        <XAxis
          dataKey="fecha"
          tickFormatter={(f: string) =>
            new Date(f).toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit" })
          }
          tick={{ fontSize: 11, fill: "#66756f" }}
          interval="preserveStartEnd"
          axisLine={{ stroke: "#e5e5e0" }}
          tickLine={false}
        />
        <YAxis
          allowDecimals={false}
          tick={{ fontSize: 11, fill: "#66756f" }}
          width={28}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          labelFormatter={(f) =>
            new Date(f as string).toLocaleDateString("es-ES", { day: "numeric", month: "long" })
          }
          formatter={(v) => [v, etiqueta] as [typeof v, string]}
          contentStyle={{ borderRadius: 12, border: "1px solid #e5e5e0", fontSize: 13 }}
        />
        <Line type="monotone" dataKey="valor" stroke={color} strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
