"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Award,
  BarChart3,
  Building2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  FileText,
  Filter,
  Inbox,
  LogOut,
  MapPin,
  Menu,
  Palette,
  Search,
  Sparkles,
  Stethoscope,
  UserCheck,
  X,
  type LucideIcon,
} from "lucide-react";
import { logout } from "./actions";

export type Avisos = { cuentas: number; visibilidad: number; leads: number; valores: number };

type Item = {
  href: string;
  texto: string;
  icono: LucideIcon;
  aviso?: keyof Avisos;
  hijos?: { href: string; texto: string; exacto?: boolean }[];
};

// Grupos del menú. Para añadir una sección nueva, basta con meterla en su grupo.
const GRUPOS: { titulo: string; items: Item[] }[] = [
  {
    titulo: "Resumen",
    items: [
      { href: "/admin/estadisticas", texto: "Estadísticas", icono: BarChart3 },
      { href: "/admin/embudo", texto: "Embudo", icono: Filter },
    ],
  },
  {
    titulo: "Centros",
    items: [
      {
        href: "/admin/clinicas",
        texto: "Clínicas",
        icono: Building2,
        hijos: [
          { href: "/admin/clinicas", texto: "Todas las clínicas", exacto: true },
          { href: "/admin/clinicas/nueva", texto: "Nueva clínica" },
          { href: "/admin/clinicas/importar", texto: "Importar una clínica" },
          { href: "/admin/clinicas/importar-provincia", texto: "Importar provincia" },
        ],
      },
      { href: "/admin/clinicas-cuentas", texto: "Cuentas de clínica", icono: UserCheck, aviso: "cuentas" },
      { href: "/admin/visibilidad", texto: "Visibilidad y planes", icono: Sparkles, aviso: "visibilidad" },
      { href: "/admin/leads", texto: "Leads", icono: Inbox, aviso: "leads" },
    ],
  },
  {
    titulo: "Contenido",
    items: [
      { href: "/admin/tratamientos", texto: "Tratamientos", icono: Stethoscope },
      { href: "/admin/blog", texto: "Blog", icono: FileText },
      { href: "/admin/valores", texto: "Valores", icono: Award, aviso: "valores" },
      { href: "/admin/geografia", texto: "Geografía", icono: MapPin },
    ],
  },
  {
    titulo: "Web",
    items: [
      { href: "/admin/seo", texto: "SEO", icono: Search },
      { href: "/admin/personalizar", texto: "Personalizar", icono: Palette },
    ],
  },
];

const COOKIE = "admin_menu";

function activo(pathname: string, href: string, exacto = false) {
  if (exacto) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * Menú lateral del panel. En escritorio se contrae a solo iconos (con
 * etiqueta al pasar el ratón) y recuerda la preferencia en una cookie,
 * que el layout lee para pintarlo ya en su estado sin parpadeo.
 * En móvil es una barra superior con un cajón deslizante.
 */
export function MenuLateral({ avisos, contraidoInicial }: { avisos: Avisos; contraidoInicial: boolean }) {
  const pathname = usePathname();
  const [contraido, setContraido] = useState(contraidoInicial);
  const [cajon, setCajon] = useState(false);

  // Cierra el cajón móvil al cambiar de página.
  useEffect(() => {
    const t = setTimeout(() => setCajon(false), 0);
    return () => clearTimeout(t);
  }, [pathname]);

  function alternar() {
    const nuevo = !contraido;
    setContraido(nuevo);
    document.cookie = `${COOKIE}=${nuevo ? "contraido" : "abierto"}; path=/admin; max-age=31536000; samesite=lax`;
  }

  return (
    <>
      {/* Móvil: barra superior + cajón */}
      <div className="sticky top-0 z-40 flex items-center justify-between border-b border-line bg-white px-4 py-3 md:hidden">
        <Logo />
        <button
          type="button"
          onClick={() => setCajon(true)}
          aria-label="Abrir menú"
          className="press flex h-10 w-10 items-center justify-center rounded-lg text-teal-dark hover:bg-paper-dim"
        >
          <Menu size={22} />
        </button>
      </div>
      {cajon && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button type="button" aria-label="Cerrar menú" onClick={() => setCajon(false)} className="absolute inset-0 bg-ink/40" />
          <aside className="relative flex h-full w-[280px] flex-col bg-white shadow-xl">
            <div className="flex items-center justify-between px-5 py-4">
              <Logo />
              <button
                type="button"
                onClick={() => setCajon(false)}
                aria-label="Cerrar menú"
                className="flex h-10 w-10 items-center justify-center rounded-lg text-teal-dark hover:bg-paper-dim"
              >
                <X size={20} />
              </button>
            </div>
            <Contenido pathname={pathname} avisos={avisos} contraido={false} />
          </aside>
        </div>
      )}

      {/* Escritorio: lateral fijo */}
      <aside
        className={`sticky top-0 hidden h-screen shrink-0 flex-col border-r border-line bg-white transition-[width] duration-200 md:flex ${
          contraido ? "w-[76px]" : "w-[248px]"
        }`}
      >
        <div className={`relative flex items-center py-5 ${contraido ? "justify-center px-2" : "px-5"}`}>
          {contraido ? (
            <Image src="/brand/w-blanca.png" alt="Growwly" width={36} height={30} className="h-7 w-auto rounded bg-teal-dark p-1" />
          ) : (
            <Logo />
          )}
          <button
            type="button"
            onClick={alternar}
            aria-label={contraido ? "Desplegar menú" : "Contraer menú"}
            className="absolute -right-3.5 top-6 flex h-7 w-7 items-center justify-center rounded-full border border-line bg-white text-teal-dark shadow-sm hover:bg-paper-dim"
          >
            {contraido ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
          </button>
        </div>
        <Contenido pathname={pathname} avisos={avisos} contraido={contraido} />
      </aside>
    </>
  );
}

function Logo() {
  return (
    <span className="flex items-center gap-2.5">
      <Image src="/brand/growwly-logo-verde.png" alt="Growwly" width={97} height={33} className="h-7 w-auto" priority />
      <span className="rounded-full bg-paper-dim px-2 py-0.5 text-[10px] font-semibold tracking-wide text-teal-dark">PANEL</span>
    </span>
  );
}

function Contenido({ pathname, avisos, contraido }: { pathname: string; avisos: Avisos; contraido: boolean }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <nav className={`flex-1 pb-4 ${contraido ? "px-3" : "overflow-y-auto px-4"}`}>
        {GRUPOS.map((g, i) => (
          <div key={g.titulo} className={i === 0 ? "" : contraido ? "mt-2 border-t border-line pt-2" : "mt-4 border-t border-line pt-4"}>
            {!contraido && (
              <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-widest text-ink-soft">{g.titulo}</p>
            )}
            <ul className="flex flex-col gap-0.5">
              {g.items.map((item) => (
                <Entrada key={item.href} item={item} pathname={pathname} aviso={item.aviso ? avisos[item.aviso] : 0} contraido={contraido} />
              ))}
            </ul>
          </div>
        ))}
      </nav>
      <div className={`flex flex-col gap-0.5 border-t border-line py-3 ${contraido ? "px-3" : "px-4"}`}>
        <Link
          href="/"
          target="_blank"
          className={`group relative flex h-10 items-center gap-3 rounded-xl text-sm text-ink-soft hover:bg-paper-dim hover:text-teal-dark ${
            contraido ? "justify-center" : "px-3"
          }`}
        >
          <ExternalLink size={18} aria-hidden />
          {contraido ? <Etiqueta texto="Ver la web" /> : "Ver la web"}
        </Link>
        <form action={logout}>
          <button
            type="submit"
            className={`group relative flex h-10 w-full items-center gap-3 rounded-xl text-sm text-ink-soft hover:bg-paper-dim hover:text-teal-dark ${
              contraido ? "justify-center" : "px-3"
            }`}
          >
            <LogOut size={18} aria-hidden />
            {contraido ? <Etiqueta texto="Cerrar sesión" /> : "Cerrar sesión"}
          </button>
        </form>
      </div>
    </div>
  );
}

function Entrada({ item, pathname, aviso, contraido }: { item: Item; pathname: string; aviso: number; contraido: boolean }) {
  const enSeccion = activo(pathname, item.href);
  const [abierto, setAbierto] = useState(enSeccion);
  const Icono = item.icono;
  const base = `group relative flex ${contraido ? "h-9" : "h-10"} w-full items-center gap-3 rounded-xl text-sm transition-colors ${
    contraido ? "justify-center" : "px-3"
  } ${enSeccion ? "bg-paper-dim font-semibold text-teal-dark" : "text-ink hover:bg-paper-dim/70 hover:text-teal-dark"}`;

  const contadorPunto = aviso > 0 && contraido && (
    <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-cyan" aria-hidden />
  );
  const contador = aviso > 0 && !contraido && (
    <span className="ml-auto rounded-full bg-cyan px-1.5 py-0.5 text-[11px] font-bold leading-none text-white">{aviso}</span>
  );

  // Con submenú y desplegado: acordeón.
  if (item.hijos && !contraido) {
    return (
      <li>
        <button type="button" onClick={() => setAbierto((v) => !v)} aria-expanded={abierto} className={base}>
          <Icono size={18} aria-hidden className="shrink-0" />
          <span className="truncate">{item.texto}</span>
          <ChevronDown size={16} aria-hidden className={`ml-auto transition-transform ${abierto ? "rotate-180" : ""}`} />
        </button>
        {abierto && (
          <ul className="ml-[22px] mt-0.5 flex flex-col gap-0.5 border-l border-line pl-3">
            {item.hijos.map((h) => {
              const on = activo(pathname, h.href, h.exacto);
              return (
                <li key={h.href}>
                  <Link
                    href={h.href}
                    aria-current={on ? "page" : undefined}
                    className={`flex h-9 items-center rounded-lg px-3 text-[13px] ${
                      on ? "bg-paper-dim font-semibold text-teal-dark" : "text-ink-soft hover:bg-paper-dim/70 hover:text-teal-dark"
                    }`}
                  >
                    {h.texto}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </li>
    );
  }

  return (
    <li>
      <Link href={item.href} aria-current={enSeccion ? "page" : undefined} className={base} aria-label={contraido ? item.texto : undefined}>
        <Icono size={18} aria-hidden className="shrink-0" />
        {contraido ? <Etiqueta texto={aviso ? `${item.texto} (${aviso})` : item.texto} /> : <span className="truncate">{item.texto}</span>}
        {contador}
        {contadorPunto}
      </Link>
    </li>
  );
}

/** Etiqueta flotante a la derecha del icono, solo con el menú contraído. */
function Etiqueta({ texto }: { texto: string }) {
  return (
    <span
      role="tooltip"
      className="pointer-events-none absolute left-full z-50 ml-3 whitespace-nowrap rounded-lg bg-teal-dark px-2.5 py-1.5 text-xs font-medium text-white opacity-0 shadow-md transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
    >
      {texto}
    </span>
  );
}
