-- Dos cosas independientes que la clínica puede solicitar desde su
-- ficha, y Santy aprueba desde su panel (mismo patrón que cuentas de
-- clínica y desbloqueo de leads: sin Stripe todavía, factura a mano).
--
-- 1) "Destacado" (ya existía como campo admin-only) — ahora además se
--    puede SOLICITAR desde el lado de la clínica.
-- 2) "Plan" (básico/premium) — controla cuánta información se muestra
--    en la ficha pública.
alter table public.clinics
  add column if not exists destacado_solicitado boolean not null default false,
  add column if not exists plan text not null default 'basico',
  add column if not exists plan_solicitado text,
  add column if not exists fotos_antes_despues jsonb not null default '[]'::jsonb,
  add column if not exists opiniones jsonb not null default '[]'::jsonb,
  add column if not exists certificados text[] not null default '{}'::text[];

comment on column public.clinics.destacado_solicitado is 'La clínica ha pedido ser destacada; pendiente de que el admin active "destacado"';
comment on column public.clinics.plan is 'basico | premium — controla qué se muestra en la ficha pública';
comment on column public.clinics.plan_solicitado is '"premium" si la clínica lo ha solicitado y está pendiente de aprobación; null si no hay solicitud';
comment on column public.clinics.fotos_antes_despues is 'Array de {antes, despues} con URLs de fotos — solo se muestra en plan premium';
comment on column public.clinics.opiniones is 'Array de {autor, texto} — opiniones/testimonios que la propia clínica añade; solo en plan premium';
comment on column public.clinics.certificados is 'URLs de imágenes de diplomas/certificados — solo en plan premium';
