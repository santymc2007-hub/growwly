-- Faltaba el permiso de UPDATE en estudios_capilares: sin él, el paso
-- que guarda el resultado de la IA (estado 'listo'/'error') se
-- rechazaba en silencio y el estudio se quedaba en 'procesando' para
-- siempre.
drop policy if exists "Los pacientes actualizan sus propios estudios" on public.estudios_capilares;
create policy "Los pacientes actualizan sus propios estudios"
on public.estudios_capilares
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
