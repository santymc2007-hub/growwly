-- Ubicación en cascada de verdad: Provincia -> Ciudad -> Zona, todo
-- desplegable, nada de texto libre — evita "Palma"/"palma"/"Palma de
-- Mallorca" como 3 valores distintos en la misma tabla.
--
-- Ambas tablas son gestionables desde /admin/geografia, así que abrir
-- una provincia nueva o afinar zonas es añadir filas, no tocar código.
create table if not exists public.municipios (
  id uuid primary key default gen_random_uuid(),
  provincia text not null,
  nombre text not null,
  created_at timestamptz not null default now(),
  unique (provincia, nombre)
);
create index if not exists municipios_provincia_idx on public.municipios (provincia);

create table if not exists public.zonas (
  id uuid primary key default gen_random_uuid(),
  municipio text not null,
  nombre text not null,
  created_at timestamptz not null default now(),
  unique (municipio, nombre)
);
create index if not exists zonas_municipio_idx on public.zonas (municipio);

-- Sembrado: los 53 municipios de Mallorca (Illes Balears), ya
-- verificados y en uso en el resto de la web.
insert into public.municipios (provincia, nombre) values
('Illes Balears', 'Alaró'), ('Illes Balears', 'Alcúdia'), ('Illes Balears', 'Algaida'),
('Illes Balears', 'Andratx'), ('Illes Balears', 'Ariany'), ('Illes Balears', 'Artà'),
('Illes Balears', 'Banyalbufar'), ('Illes Balears', 'Binissalem'), ('Illes Balears', 'Búger'),
('Illes Balears', 'Bunyola'), ('Illes Balears', 'Calvià'), ('Illes Balears', 'Campanet'),
('Illes Balears', 'Campos'), ('Illes Balears', 'Capdepera'), ('Illes Balears', 'Consell'),
('Illes Balears', 'Costitx'), ('Illes Balears', 'Deià'), ('Illes Balears', 'Escorca'),
('Illes Balears', 'Esporles'), ('Illes Balears', 'Estellencs'), ('Illes Balears', 'Felanitx'),
('Illes Balears', 'Fornalutx'), ('Illes Balears', 'Inca'), ('Illes Balears', 'Lloret de Vistalegre'),
('Illes Balears', 'Lloseta'), ('Illes Balears', 'Llubí'), ('Illes Balears', 'Llucmajor'),
('Illes Balears', 'Manacor'), ('Illes Balears', 'Mancor de la Vall'), ('Illes Balears', 'Maria de la Salut'),
('Illes Balears', 'Marratxí'), ('Illes Balears', 'Montuïri'), ('Illes Balears', 'Muro'),
('Illes Balears', 'Palma'), ('Illes Balears', 'Petra'), ('Illes Balears', 'Pollença'),
('Illes Balears', 'Porreres'), ('Illes Balears', 'Puigpunyent'), ('Illes Balears', 'Sa Pobla'),
('Illes Balears', 'Sant Joan'), ('Illes Balears', 'Sant Llorenç des Cardassar'), ('Illes Balears', 'Santa Eugènia'),
('Illes Balears', 'Santa Margalida'), ('Illes Balears', 'Santa Maria del Camí'), ('Illes Balears', 'Santanyí'),
('Illes Balears', 'Selva'), ('Illes Balears', 'Sencelles'), ('Illes Balears', 'Ses Salines'),
('Illes Balears', 'Sineu'), ('Illes Balears', 'Sóller'), ('Illes Balears', 'Son Servera'),
('Illes Balears', 'Valldemossa'), ('Illes Balears', 'Vilafranca de Bonany')
on conflict (provincia, nombre) do nothing;

-- Sembrado: zonas/barrios de Palma (único municipio de Mallorca lo
-- bastante grande para tener barrios reconocidos — los pueblos
-- pequeños no los tienen, se deja sin zonas y el campo queda opcional).
-- Nombres verificados por fuente real (Wikipedia/ayuntamiento/prensa
-- local), no una lista inventada — puede completarse desde admin.
insert into public.zonas (municipio, nombre) values
('Palma', 'La Seu'), ('Palma', 'Sant Jaume'), ('Palma', 'Puig de Sant Pere'),
('Palma', 'La Llotja'), ('Palma', 'Born'), ('Palma', 'Jaume III'),
('Palma', 'La Missió'), ('Palma', 'El Mercat'), ('Palma', 'Cort'),
('Palma', 'Sindicat'), ('Palma', 'La Calatrava'), ('Palma', 'Santa Catalina'),
('Palma', 'Es Jonquet'), ('Palma', 'Son Espanyolet'), ('Palma', 'El Terreno'),
('Palma', 'Son Armadans'), ('Palma', 'Cala Major'), ('Palma', 'Sant Agustí'),
('Palma', 'Gènova'), ('Palma', 'La Bonanova'), ('Palma', 'Portopí'),
('Palma', 'Bellver'), ('Palma', 'Son Vida'), ('Palma', 'Son Roca'),
('Palma', 'Son Anglada'), ('Palma', 'Son Ximelis'), ('Palma', 'Son Rapinya'),
('Palma', 'Establiments'), ('Palma', 'Son Sardina'), ('Palma', 'Sa Indioteria'),
('Palma', 'Bons Aires'), ('Palma', 'Es Camp Redó'), ('Palma', 'Arxiduc'),
('Palma', 'Son Oliva'), ('Palma', 'Pere Garau'), ('Palma', 'Portixol'),
('Palma', 'Molinar'), ('Palma', 'Es Rafal'), ('Palma', 'Son Gotleu'),
('Palma', 'Son Cladera'), ('Palma', 'Es Camp d''en Serralta'), ('Palma', 'Foners'),
('Palma', 'Blanquerna'), ('Palma', 'Playa de Palma'), ('Palma', 'Ciudad Jardín'),
('Palma', 'Es Pil·larí'), ('Palma', 'S''Aranjassa'), ('Palma', 'Sant Jordi'),
('Palma', 'Son Ferriol'), ('Palma', 'Casablanca')
on conflict (municipio, nombre) do nothing;
