import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";
import type { ReactNode } from "react";

type Variant = "clinica" | "paciente" | "admin";

type Config = {
  /** Etiqueta que diferencia cada acceso. */
  acceso: string;
  chip: string;
  /** Foto del lado visual (sin foto = panel de marca). */
  imagen: { src: string; alt: string } | null;
  /** Rótulo que acompaña a la foto en escritorio. */
  claim: string;
  /** Mensaje de captación debajo de la tarjeta. */
  mensaje: string | null;
  /** Halo de color detrás de la foto. */
  halo: string;
};

const VARIANTE: Record<Variant, Config> = {
  paciente: {
    acceso: "Acceso clientes",
    chip: "bg-yellow text-teal-dark",
    imagen: {
      src: "/brand/login-clientes.webp",
      alt: "Chica sonriendo con el pelo rizado",
    },
    claim: "Tu pelo en buenas manos",
    mensaje: "Pide presupuesto a clínicas sin moverte de casa",
    halo:
      "radial-gradient(closest-side, color-mix(in srgb, var(--color-lima) 35%, transparent), transparent), radial-gradient(closest-side at 30% 30%, color-mix(in srgb, var(--color-sage) 45%, transparent), transparent)",
  },
  clinica: {
    acceso: "Acceso clínicas",
    chip: "bg-teal-dark text-white",
    imagen: {
      src: "/brand/login-clinicas.webp",
      alt: "Equipo médico con batas de Growwly",
    },
    claim: "Pacientes que ya te están buscando",
    mensaje: "Gestiona tu ficha y atrae nuevos pacientes",
    halo:
      "radial-gradient(closest-side, color-mix(in srgb, var(--color-sage) 45%, transparent), transparent), radial-gradient(closest-side at 70% 70%, color-mix(in srgb, var(--color-lima) 35%, transparent), transparent)",
  },
  admin: {
    acceso: "Acceso admin",
    chip: "bg-ink text-white",
    imagen: null,
    claim: "Panel de administración",
    mensaje: null,
    halo:
      "radial-gradient(closest-side, color-mix(in srgb, var(--color-lima) 30%, transparent), transparent)",
  },
};

export function AuthCard({
  variant,
  children,
}: {
  variant: Variant;
  children: ReactNode;
}) {
  const v = VARIANTE[variant];

  return (
    <main className="relative min-h-screen overflow-hidden bg-paper">
      {/* Degradado circular suave de fondo, como en la home. Las fotos
          ya traen su propio halo de color sobre blanco, así que el
          fondo detrás de ellas se deja blanco liso. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-48 -right-32 h-[560px] w-[560px] opacity-60"
        style={{ backgroundImage: v.halo }}
      />

      <header className="relative z-10 mx-auto flex max-w-[1200px] items-center justify-between px-6 py-4">
        <Link href="/" aria-label="Growwly — inicio">
          <Image
            src="/brand/growwly-logo-verde.png"
            alt="Growwly"
            width={889}
            height={303}
            className="h-10 w-auto sm:h-12"
            priority
          />
        </Link>
        <Link
          href="/"
          className="press inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium text-ink-soft transition-colors hover:text-teal-dark"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          <span className="hidden sm:inline">Volver a growwly.es</span>
          <span className="sm:hidden">Volver</span>
        </Link>
      </header>

      {/* Con foto: en escritorio la foto va grande y la tarjeta se monta
          por encima de su lado derecho. Sin foto (admin): dos columnas. */}
      <div
        className={`relative z-10 mx-auto max-w-[1200px] px-6 pb-12 lg:min-h-[calc(100vh-88px)] ${
          v.imagen
            ? "flex flex-col lg:flex-row lg:items-center lg:justify-center"
            : "grid items-center lg:grid-cols-[0.9fr_1fr] lg:gap-12"
        }`}
      >
        {/* ── Lado visual ── (la foto solo se muestra en escritorio; en
            móvil y tablet, solo la tarjeta) */}
        {v.imagen ? (
          <div className="relative hidden lg:mx-0 lg:block lg:w-[560px] lg:max-w-none lg:shrink-0 xl:w-[676px]">
            <div className="entra relative aspect-[1000/1084]">
              <Image
                src={v.imagen.src}
                alt={v.imagen.alt}
                fill
                sizes="(min-width: 1024px) 676px, 300px"
                className="object-contain"
                priority
              />
            </div>
            <p className="entra d2 absolute bottom-10 left-0 hidden max-w-[17rem] rounded-2xl bg-white/90 px-5 py-4 font-display text-2xl font-extrabold leading-tight text-teal-dark shadow-[0_10px_30px_-12px_rgba(0,86,107,0.35)] backdrop-blur lg:block">
              {v.claim}
            </p>
          </div>
        ) : (
          <div className="entra hidden aspect-[4/5] max-h-[560px] flex-col justify-end overflow-hidden rounded-[28px] bg-logo p-10 lg:flex">
            <Image
              src="/brand/growwly-logo-white.png"
              alt=""
              width={530}
              height={181}
              className="h-16 w-auto self-start"
            />
            <p className="mt-6 font-display text-4xl font-extrabold leading-tight text-white">
              {v.claim}
            </p>
            <p className="mt-2 text-base font-medium text-white/85">
              Clínicas, leads, contenidos y estadísticas.
            </p>
          </div>
        )}

        {/* ── Tarjeta ── */}
        <div
          className={`relative mx-auto w-full max-w-md ${
            v.imagen
              ? "z-10 mt-4 sm:mt-8 lg:mx-0 lg:-ml-32 lg:mt-0 lg:shrink-0"
              : "mt-6 lg:mt-0"
          }`}
        >
          <div className="entra d1 rounded-[28px] bg-white p-6 shadow-[0_24px_60px_-24px_rgba(0,86,107,0.35)] ring-1 ring-line sm:p-9">
            <span
              className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] ${v.chip}`}
            >
              {v.acceso}
            </span>
            {children}
          </div>

          {v.mensaje && (
            <p className="entra d2 mt-5 flex items-center justify-center gap-2 text-center text-sm font-semibold text-teal-dark">
              <Sparkles className="h-4 w-4 shrink-0 text-cyan-dark" aria-hidden />
              {v.mensaje}
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
