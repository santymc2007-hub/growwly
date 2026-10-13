// Descarga una imagen de la web de una clínica para subirla a nuestro
// propio Storage (así la ficha no depende de que la clínica cambie o
// borre su web, ni hace hotlinking a su servidor).

const TIPOS_VALIDOS = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const MAX_BYTES = 8 * 1024 * 1024;

const EXTENSION: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};

function hostPermitido(url: URL): boolean {
  const host = url.hostname.toLowerCase();
  // Nunca pedir nada a la red interna: estas URLs llegan desde el navegador.
  if (host === "localhost" || host.endsWith(".local") || host.endsWith(".internal")) return false;
  if (/^(127\.|10\.|0\.|169\.254\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(host)) return false;
  if (host.startsWith("[")) return false;
  return true;
}

export async function descargarImagen(urlTexto: string, nombreBase: string): Promise<File> {
  const url = new URL(urlTexto);
  if ((url.protocol !== "https:" && url.protocol !== "http:") || !hostPermitido(url)) {
    throw new Error(`URL de imagen no permitida: ${urlTexto}`);
  }

  const res = await fetch(url, {
    headers: {
      // Algunas webs devuelven 403 a peticiones sin User-Agent de navegador.
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36",
      Accept: "image/avif,image/webp,image/png,image/jpeg,*/*;q=0.5",
    },
    signal: AbortSignal.timeout(12000),
  });

  if (!res.ok) throw new Error(`No se pudo descargar la imagen (${res.status}).`);

  const tipo = (res.headers.get("content-type") ?? "").split(";")[0].trim().toLowerCase();
  if (!TIPOS_VALIDOS.includes(tipo)) {
    throw new Error(`El archivo no es una imagen válida (${tipo || "tipo desconocido"}).`);
  }

  const buffer = await res.arrayBuffer();
  if (buffer.byteLength > MAX_BYTES) throw new Error("La imagen pesa más de 8MB.");

  return new File([buffer], `${nombreBase}.${EXTENSION[tipo]}`, { type: tipo });
}
