"use client";

import Link, { type LinkProps } from "next/link";
import type { AnchorHTMLAttributes, ReactNode } from "react";
import { trackEvent } from "@/lib/analytics/events";

type Parametros = Record<string, string | number | boolean | undefined>;

/** Como TrackedLink pero para enlaces internos (next/link). */
export function TrackedNextLink({
  evento,
  parametros,
  onClick,
  children,
  ...props
}: LinkProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof LinkProps> & {
    evento: string;
    parametros?: Parametros;
    children?: ReactNode;
  }) {
  return (
    <Link
      {...props}
      onClick={(e) => {
        trackEvent(evento, parametros);
        onClick?.(e);
      }}
    >
      {children}
    </Link>
  );
}
