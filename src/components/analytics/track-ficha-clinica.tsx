"use client";

import { useEffect } from "react";
import { trackEvent } from "@/lib/analytics/events";

export function TrackFichaClinica({
  clinicId,
  nombre,
  plan,
  ciudad,
}: {
  clinicId: string;
  nombre: string;
  plan: string;
  ciudad: string | null;
}) {
  useEffect(() => {
    trackEvent("ver_ficha_clinica", {
      clinic_id: clinicId,
      clinic_nombre: nombre,
      clinic_plan: plan,
      ciudad: ciudad ?? undefined,
    });
  }, [clinicId, nombre, plan, ciudad]);

  return null;
}
