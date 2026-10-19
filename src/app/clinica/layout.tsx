import { MascaraClarity } from "@/components/analytics/mascara-clarity";

// Panel y enlaces de clínicas: datos de pacientes y de la clínica,
// ocultos en Microsoft Clarity.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <MascaraClarity>{children}</MascaraClarity>;
}
