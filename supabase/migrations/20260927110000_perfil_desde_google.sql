-- Registro con Google: Google no manda "nombre"/"apellidos" sino
-- "given_name"/"family_name" (o "full_name"/"name"). Se usan como
-- respaldo para que el perfil del paciente no quede sin nombre.

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
    nullif(new.raw_user_meta_data ->> 'edad', '')::integer,
    coalesce(new.raw_user_meta_data ->> 'role', 'patient')
  )
  on conflict (id) do nothing;
  return new;
end;
$function$;
