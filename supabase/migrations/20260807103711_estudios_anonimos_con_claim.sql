-- Permite crear un estudio SIN usuario todavía (análisis desde la home,
-- antes de registrarse). Cada estudio tiene un "claim_token": el enlace
-- de la página de espera y el que vincula el estudio a la cuenta en
-- cuanto el visitante se registra o inicia sesión.
alter table public.estudios_capilares
  alter column user_id drop not null,
  add column if not exists claim_token uuid not null default gen_random_uuid();

comment on column public.estudios_capilares.claim_token is 'Token para vincular un estudio anónimo a la cuenta que se registre/inicie sesión después';

create unique index if not exists estudios_claim_token_idx on public.estudios_capilares (claim_token);
