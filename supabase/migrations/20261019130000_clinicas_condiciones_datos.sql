-- Aceptación, por parte de cada clínica, de las condiciones sobre los
-- datos de pacientes que recibe a través de Growwly: pasa a ser
-- responsable independiente de esos datos, solo los usa para atender
-- la solicitud, guarda secreto profesional y los borra si el paciente
-- no sigue adelante. Se pide en el panel antes de ver la primera
-- solicitud (el plan de pago se contrata fuera de la web).
--
-- Se guarda quién aceptó, cuándo y qué versión del texto
-- (VERSION_CONDICIONES_DATOS en src/lib/clinica/condiciones-datos.ts).
-- Si cambia la versión, se vuelve a pedir. Solo servidor (RLS sin
-- políticas en clinic_privado).
alter table public.clinic_privado add column if not exists condiciones_datos_en timestamptz;
alter table public.clinic_privado add column if not exists condiciones_datos_version text;
alter table public.clinic_privado add column if not exists condiciones_datos_por uuid references public.profiles(id) on delete set null;
