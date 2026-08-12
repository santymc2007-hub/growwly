/**
 * Redimensiona y comprime una imagen en el propio navegador antes de
 * subirla. Pensado para evitar que fotos de móvil sin optimizar (a
 * veces 5-10MB cada una) hagan que un formulario con varias fotos a la
 * vez supere el límite de tamaño de la petición.
 */
export async function comprimirImagen(
  file: File,
  maxDimension = 1600,
  calidad = 0.82,
): Promise<File> {
  if (!file.type.startsWith("image/") || file.type === "image/svg+xml") {
    return file;
  }

  try {
    const bitmap = await createImageBitmap(file);
    let { width, height } = bitmap;

    // Ya es razonablemente pequeña — no merece la pena tocarla.
    if (width <= maxDimension && height <= maxDimension && file.size < 1_200_000) {
      bitmap.close();
      return file;
    }

    const ratio = Math.min(1, maxDimension / Math.max(width, height));
    width = Math.round(width * ratio);
    height = Math.round(height * ratio);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const blob: Blob | null = await new Promise((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", calidad),
    );
    if (!blob) return file;

    return new File([blob], file.name.replace(/\.\w+$/, ".jpg"), {
      type: "image/jpeg",
    });
  } catch {
    // Si algo falla comprimiendo, mejor subir el original que bloquear
    // al usuario.
    return file;
  }
}

/** Recorre un FormData y comprime todos los campos que sean imágenes. */
export async function comprimirFormData(original: FormData): Promise<FormData> {
  const resultado = new FormData();
  for (const [key, value] of original.entries()) {
    if (value instanceof File && value.size > 0 && value.type.startsWith("image/")) {
      resultado.append(key, await comprimirImagen(value));
    } else {
      resultado.append(key, value);
    }
  }
  return resultado;
}
