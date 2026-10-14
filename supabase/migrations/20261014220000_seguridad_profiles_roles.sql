-- Auditoría de seguridad (oct 2026) — escalada de privilegios en profiles.
--
-- Antes: la política "Los usuarios editan su propio perfil" dejaba que
-- cualquier usuario autenticado actualizase CUALQUIER columna de su
-- propia fila (incluidas role, clinic_id y clinic_status) llamando a la
-- API REST de Supabase con la clave pública. Y handle_new_user copiaba
-- el role que mandase el navegador en el alta. Resultado: cualquier
-- paciente podía hacerse admin.
--
-- Todos los cambios legítimos de role/clinic_id/clinic_status los hace
-- el servidor con la clave secreta (service_role), que no se ve
-- afectada por estos permisos.

-- 1. Solo se pueden editar desde el navegador las columnas que el
--    paciente edita en /cuenta y en el formulario de solicitud.
revoke update on public.profiles from anon, authenticated;
grant update (
  nombre,
  apellidos,
  telefono,
  ciudad,
  fecha_nacimiento,
  edad,
  sexo,
  tipo_perdida_cabello,
  acepta_marketing_email
) on public.profiles to authenticated;

-- Nadie inserta ni borra perfiles desde el navegador (los crea el
-- trigger de alta y se borran en cascada con auth.users).
revoke insert, delete, truncate on public.profiles from anon, authenticated;

-- 2. El alta nunca crea admins: solo 'clinic' (registro de clínicas,
--    que igualmente necesita aprobación para tener acceso) o 'patient'.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  insert into public.profiles (id, email, nombre, apellidos, telefono, edad, role)
  values (
    new.id,
    new.email,
    coalesce(
      nullif(new.raw_user_meta_data ->> 'nombre', ''),
      nullif(new.raw_user_meta_data ->> 'given_name', ''),
      nullif(split_part(coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', ''), ' ', 1), '')
    ),
    coalesce(
      nullif(new.raw_user_meta_data ->> 'apellidos', ''),
      nullif(new.raw_user_meta_data ->> 'family_name', '')
    ),
    new.raw_user_meta_data ->> 'telefono',
    case
      when (new.raw_user_meta_data ->> 'edad') ~ '^[0-9]{1,3}$'
        then (new.raw_user_meta_data ->> 'edad')::integer
      else null
    end,
    case
      when new.raw_user_meta_data ->> 'role' = 'clinic' then 'clinic'
      else 'patient'
    end
  )
  on conflict (id) do nothing;
  return new;
end;
$function$;

-- El trigger se ejecuta igual; lo que se quita es poder llamarla por
-- /rest/v1/rpc/handle_new_user (aviso de Supabase Advisors).
revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- 3. Red de seguridad: valores de role/clinic_status acotados.
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles
  add constraint profiles_role_check check (role in ('patient', 'clinic', 'admin'));
