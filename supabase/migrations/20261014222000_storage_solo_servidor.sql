-- Auditoría de seguridad (oct 2026) — Storage.
--
-- Antes cualquier usuario autenticado (cualquier paciente recién
-- registrado) podía subir, sobrescribir y borrar cualquier archivo de
-- los buckets públicos clinic-photos y blog-photos, sin límite de
-- tamaño ni de tipo (un .html o .svg ahí es phishing/XSS servido desde
-- el dominio de Supabase).
--
-- Todas las subidas y borrados de esos buckets los hace ya el servidor
-- con la clave secreta (acciones de admin, ficha de clínica,
-- importador), que no pasa por estas políticas. La lectura pública se
-- mantiene.

-- (Se dejan las políticas y se restringen a service_role en vez de
-- borrarlas: el borrado necesitaba confirmación manual. Efecto igual;
-- se pueden borrar más adelante.)
alter policy "Authenticated users can upload clinic photos" on storage.objects to service_role;
alter policy "Authenticated users can update clinic photos" on storage.objects to service_role;
alter policy "Authenticated users can delete clinic photos" on storage.objects to service_role;
alter policy "Authenticated users can upload blog photos" on storage.objects to service_role;
alter policy "Authenticated users can update blog photos" on storage.objects to service_role;
alter policy "Authenticated users can delete blog photos" on storage.objects to service_role;

-- Solo imágenes rasterizadas (nada de SVG/HTML) y tamaño acotado.
update storage.buckets
set file_size_limit = 10485760, -- 10 MB
    allowed_mime_types = array[
      'image/jpeg', 'image/png', 'image/webp', 'image/avif',
      'image/gif', 'image/heic', 'image/heif'
    ]
where id in ('clinic-photos', 'blog-photos', 'hero-slides');

-- Fotos de análisis (privado): solo tamaño. El tipo se valida en el
-- servidor al subir (un móvil puede mandar la foto sin content-type).
update storage.buckets
set file_size_limit = 15728640 -- 15 MB
where id = 'estudios-capilares';
