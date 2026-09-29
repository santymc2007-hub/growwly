"use client";

import Image from "next/image";
import { useState, useTransition } from "react";
import { ChevronDown } from "lucide-react";
import { ConfirmButton } from "@/components/confirm-button";
import {
  descartarPropuesta,
  elegirClinica,
  marcarPropuestaVista,
} from "@/app/cuenta/solicitud/actions";

export type TipoFilaClinica = "pendiente" | "preparando" | "nueva" | "vista" | "descartada";

export type OfertaClinica = {
  tratamiento: string | null;
  precio: string;
  tipoPrecio: string | null;
  filas: { k: string; v: string }[];
  incluye: string[];
  mensaje: string | null;
};

export type FilaClinica = {
  leadId: string;
  tipo: TipoFilaClinica;
  nombre: string;
  inicial: string;
  logoUrl: string | null;
  detalle: string;
  oferta: OfertaClinica | null;
};

const CHIP: Record<TipoFilaClinica, { texto: string; clase: string } | null> = {
  pendiente: { texto: "Pendiente de ver", clase: "border border-line bg-white text-ink-soft" },
  preparando: { texto: "Preparando propuesta", clase: "bg-[#dcf0fa] text-teal-dark" },
  nueva: { texto: "Propuesta nueva", clase: "bg-yellow text-teal-dark" },
  vista: null,
  descartada: { texto: "Descartada", clase: "border border-line bg-white text-ink-soft" },
};

const LEYENDA = [
  { t: "Pendiente de ver", d: "aún no ha abierto tu caso", punto: "border border-[#b9c9c4] bg-white" },
  { t: "Preparando propuesta", d: "ya ha visto tu caso", punto: "bg-brand-blue" },
  { t: "Propuesta nueva", d: "te está esperando", punto: "bg-yellow" },
];

export function ClinicasSolicitud({
  solicitudId,
  filas,
  totalClinicas,
}: {
  solicitudId: string;
  filas: FilaClinica[];
  totalClinicas: number;
}) {
  const [abierta, setAbierta] = useState<string | null>(null);
  const [vistasAhora, setVistasAhora] = useState<Set<string>>(new Set());
  const [, startTransition] = useTransition();

  const recibidas = filas.filter((f) => f.oferta).length;

  function alternar(fila: FilaClinica) {
    if (!fila.oferta || fila.tipo === "descartada") return;
    const abrir = abierta !== fila.leadId;
    setAbierta(abrir ? fila.leadId : null);
    if (abrir && fila.tipo === "nueva" && !vistasAhora.has(fila.leadId)) {
      setVistasAhora((prev) => new Set(prev).add(fila.leadId));
      startTransition(() => marcarPropuestaVista(solicitudId, fila.leadId));
    }
  }

  return (
    <section className="flex flex-col gap-4 rounded-3xl border border-line p-6 sm:p-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex max-w-2xl flex-col gap-1.5">
          <h2 className="font-display text-2xl font-extrabold text-teal-dark sm:text-[28px]">
            Tus clínicas
          </h2>
          <p className="text-base text-ink-soft">
            Verás el nombre de cada clínica cuando te envíe su propuesta. Tu contacto solo
            llega a la que elijas.
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-[#f4f9f7] px-3.5 py-2 text-sm font-semibold text-teal-dark">
          {recibidas} de {totalClinicas} {totalClinicas === 1 ? "propuesta" : "propuestas"}
        </span>
      </div>

      <ul className="flex flex-col gap-3">
        {filas.map((fila) => {
          const tipo =
            fila.tipo === "nueva" && vistasAhora.has(fila.leadId) ? "vista" : fila.tipo;
          const chip = CHIP[tipo];
          const expandible = Boolean(fila.oferta) && tipo !== "descartada";
          const open = expandible && abierta === fila.leadId;
          const conPropuesta = tipo === "nueva" || tipo === "vista";

          return (
            <li
              key={fila.leadId}
              className={`overflow-hidden rounded-[18px] ${
                tipo === "nueva"
                  ? "border-2 border-yellow bg-white shadow-[0_10px_24px_-12px_rgba(31,85,104,0.25)]"
                  : "bg-[#f4f9f7]"
              } ${tipo === "descartada" ? "opacity-60" : ""}`}
            >
              <button
                type="button"
                onClick={() => alternar(fila)}
                disabled={!expandible}
                aria-expanded={expandible ? open : undefined}
                className={`flex w-full items-center gap-4 px-4 py-4 text-left sm:px-5 ${
                  expandible ? "cursor-pointer" : "cursor-default"
                }`}
              >
                {fila.logoUrl && conPropuesta ? (
                  <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-sage">
                    <Image src={fila.logoUrl} alt="" fill sizes="48px" className="object-cover" />
                  </span>
                ) : (
                  <span
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full font-display text-lg font-extrabold ${
                      conPropuesta || tipo === "descartada"
                        ? "bg-sage text-sage-ink"
                        : tipo === "preparando"
                          ? "bg-white text-teal-dark"
                          : "bg-white text-[#9aa9a4]"
                    }`}
                  >
                    {fila.inicial}
                  </span>
                )}
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="font-display text-lg font-bold text-teal-dark">
                    {fila.nombre}
                  </span>
                  <span className="text-sm text-ink-soft">{fila.detalle}</span>
                </span>
                {chip && (
                  <span
                    className={`hidden shrink-0 rounded-full px-3 py-1.5 text-[13px] font-bold sm:inline ${chip.clase}`}
                  >
                    {chip.texto}
                  </span>
                )}
                {expandible && (
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-line bg-white text-teal-dark transition-transform ${
                      open ? "rotate-180" : ""
                    }`}
                    aria-hidden
                  >
                    <ChevronDown className="h-4 w-4" />
                  </span>
                )}
              </button>
              {chip && (
                <span
                  className={`mx-4 mb-4 -mt-1 inline-block rounded-full px-3 py-1 text-xs font-bold sm:hidden ${chip.clase}`}
                >
                  {chip.texto}
                </span>
              )}

              {open && fila.oferta && (
                <Oferta
                  solicitudId={solicitudId}
                  leadId={fila.leadId}
                  nombreClinica={fila.nombre}
                  oferta={fila.oferta}
                />
              )}
            </li>
          );
        })}
      </ul>

      <div className="flex flex-wrap gap-x-5 gap-y-2 pt-2 text-[13px] text-ink-soft">
        {LEYENDA.map((l) => (
          <span key={l.t} className="flex items-center gap-2">
            <span className={`h-2.5 w-2.5 rounded-full ${l.punto}`} />
            <strong className="font-semibold text-teal-dark">{l.t}</strong> · {l.d}
          </span>
        ))}
      </div>
    </section>
  );
}

function Oferta({
  solicitudId,
  leadId,
  nombreClinica,
  oferta,
}: {
  solicitudId: string;
  leadId: string;
  nombreClinica: string;
  oferta: OfertaClinica;
}) {
  return (
    <div className="mx-3 mb-3 flex flex-col gap-5 rounded-2xl border border-line bg-white p-5 sm:mx-5 sm:mb-5 sm:p-6">
      <div className="grid gap-4 md:grid-cols-[240px_minmax(0,1fr)]">
        <div className="flex flex-col gap-1 rounded-2xl bg-[#f4f9f7] p-5">
          {oferta.tratamiento && (
            <span className="text-[13px] font-semibold text-ink-soft">{oferta.tratamiento}</span>
          )}
          <span className="font-display text-[34px] font-extrabold leading-tight tracking-tight text-teal-dark">
            {oferta.precio}
          </span>
          {oferta.tipoPrecio && (
            <span className="text-[13px] font-semibold text-teal">{oferta.tipoPrecio}</span>
          )}
        </div>
        {oferta.filas.length > 0 && (
          <dl className="grid content-start gap-2.5 sm:grid-cols-2">
            {oferta.filas.map((r) => (
              <div
                key={r.k}
                className="flex flex-col gap-0.5 rounded-xl border border-[#eef3f1] px-3.5 py-3"
              >
                <dt className="text-xs text-ink-soft">{r.k}</dt>
                <dd className="text-[15px] font-bold text-teal-dark">{r.v}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>

      {oferta.incluye.length > 0 && (
        <ul className="grid gap-x-4 gap-y-2 sm:grid-cols-2 lg:grid-cols-3">
          {oferta.incluye.map((i) => (
            <li key={i} className="flex items-center gap-2 text-sm text-ink">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sage text-[11px] font-extrabold text-sage-ink">
                ✓
              </span>
              {i}
            </li>
          ))}
        </ul>
      )}

      {oferta.mensaje && (
        <div className="flex flex-col gap-1.5 rounded-r-2xl border-l-[3px] border-brand-green bg-[#f4f9f7] px-4 py-4">
          <span className="text-xs font-bold text-sage-ink">Mensaje de {nombreClinica}</span>
          <p className="whitespace-pre-line text-[15px] leading-relaxed text-ink">
            “{oferta.mensaje}”
          </p>
        </div>
      )}

      <div className="flex flex-col gap-4 border-t border-[#eef3f1] pt-4 md:flex-row md:items-center">
        <p className="flex-1 text-sm leading-relaxed text-ink-soft">
          Si te quedas con esta propuesta, le pasamos tu nombre, teléfono y email para que te
          proponga fechas de valoración. Precio orientativo: el definitivo se confirma en la
          valoración.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <ConfirmButton
            action={descartarPropuesta.bind(null, solicitudId, leadId)}
            triggerLabel="No, gracias"
            title={`¿Descartar la propuesta de ${nombreClinica}?`}
            message="No le llegará ningún dato tuyo y dejará de aparecer como opción."
            confirmLabel="Sí, descartar"
            cancelLabel="Volver"
            triggerClassName="h-11 rounded-full border border-line bg-white px-5 text-[15px] font-semibold text-ink-soft transition hover:border-teal/40"
          />
          <ConfirmButton
            action={elegirClinica.bind(null, solicitudId, leadId)}
            triggerLabel="Sí, me quedo con esta"
            title={`¿Te quedas con ${nombreClinica}?`}
            message="Le pasaremos tu nombre, teléfono y email para que te proponga fechas de valoración. El resto de clínicas dejarán de ver tu solicitud."
            confirmLabel="Sí, me quedo con esta"
            cancelLabel="Volver"
            triggerClassName="press h-[50px] rounded-full bg-yellow px-6 font-display text-base font-bold text-teal-dark shadow-[0_10px_15px_-3px_rgba(232,239,45,0.3)] hover:opacity-90"
          />
        </div>
      </div>
    </div>
  );
}
