"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { trackEvent } from "@/lib/analytics/events";
import { registrarPaso } from "@/lib/analytics/embudo";
import type { PasoEmbudo } from "@/lib/analytics/embudo-pasos";

type Parametros = Record<string, string | number | boolean | undefined>;

/**
 * Para eventos que solo se pueden saber tras un redirect de Server
 * Action (registro, análisis enviado...) — donde no hay un "return"
 * de cliente al que engancharse. La action añade `?param=valor` al
 * redirect; esto lo detecta al llegar, dispara el evento una vez y
 * limpia el parámetro de la URL (así un refresco de la página no
 * vuelve a contarlo).
 */
export function TrackOnceParam({
  param,
  evento,
  parametros,
  pasoEmbudo,
  detalleEmbudo,
}: {
  param: string;
  evento: string;
  parametros?: Parametros;
  /** Además, apunta este paso en el embudo propio (embudo_eventos). */
  pasoEmbudo?: PasoEmbudo;
  detalleEmbudo?: string;
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!searchParams.has(param)) return;

    trackEvent(evento, { ...parametros, [param]: searchParams.get(param) ?? undefined });
    if (pasoEmbudo) registrarPaso(pasoEmbudo, detalleEmbudo);

    const restantes = new URLSearchParams(searchParams.toString());
    restantes.delete(param);
    const query = restantes.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [searchParams, router, pathname, param, evento, parametros, pasoEmbudo, detalleEmbudo]);

  return null;
}
