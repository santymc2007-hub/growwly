/**
 * Comprobaciones rápidas de cada fotograma de la cámara, en el propio
 * móvil: luz, nitidez y si el móvil está quieto. Se trabaja sobre una
 * copia pequeña del fotograma (≈160 px) para que vaya fluido.
 */

export type Calidad = {
  /** Brillo medio 0-255. */
  luz: number;
  /** Varianza del laplaciano: más alto = más nítido. */
  nitidez: number;
  /** Diferencia media con el fotograma anterior: más alto = más movimiento. */
  movimiento: number;
};

export const UMBRAL = {
  luzMin: 70,
  luzMax: 215,
  nitidezMin: 60,
  movimientoMax: 6,
};

const ANCHO = 160;

export class MedidorCalidad {
  private lienzo: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private anterior: Float32Array | null = null;

  constructor() {
    this.lienzo = document.createElement("canvas");
    this.ctx = this.lienzo.getContext("2d", { willReadFrequently: true })!;
  }

  medir(video: HTMLVideoElement): Calidad | null {
    const vw = video.videoWidth;
    const vh = video.videoHeight;
    if (!vw || !vh) return null;
    const w = ANCHO;
    const h = Math.max(1, Math.round((vh / vw) * ANCHO));
    if (this.lienzo.width !== w || this.lienzo.height !== h) {
      this.lienzo.width = w;
      this.lienzo.height = h;
      this.anterior = null;
    }
    this.ctx.drawImage(video, 0, 0, w, h);
    const { data } = this.ctx.getImageData(0, 0, w, h);

    const gris = new Float32Array(w * h);
    let suma = 0;
    for (let i = 0, p = 0; i < data.length; i += 4, p++) {
      const g = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      gris[p] = g;
      suma += g;
    }
    const luz = suma / gris.length;

    // Laplaciano 4-vecinos sobre la zona central (los bordes suelen ser fondo).
    let n = 0;
    let media = 0;
    let m2 = 0;
    const x0 = Math.floor(w * 0.2);
    const x1 = Math.ceil(w * 0.8);
    const y0 = Math.floor(h * 0.2);
    const y1 = Math.ceil(h * 0.8);
    for (let y = Math.max(1, y0); y < Math.min(h - 1, y1); y++) {
      for (let x = Math.max(1, x0); x < Math.min(w - 1, x1); x++) {
        const i = y * w + x;
        const l = gris[i - 1] + gris[i + 1] + gris[i - w] + gris[i + w] - 4 * gris[i];
        n++;
        const d = l - media;
        media += d / n;
        m2 += d * (l - media);
      }
    }
    const nitidez = n > 1 ? m2 / (n - 1) : 0;

    let movimiento = 0;
    if (this.anterior && this.anterior.length === gris.length) {
      let dif = 0;
      for (let i = 0; i < gris.length; i++) dif += Math.abs(gris[i] - this.anterior[i]);
      movimiento = dif / gris.length;
    }
    this.anterior = gris;

    return { luz, nitidez, movimiento };
  }
}

/** Foto a resolución completa del fotograma actual (sin espejo). */
export function capturarFotograma(video: HTMLVideoElement, nombre: string): Promise<File | null> {
  const lienzo = document.createElement("canvas");
  lienzo.width = video.videoWidth;
  lienzo.height = video.videoHeight;
  lienzo.getContext("2d")!.drawImage(video, 0, 0);
  return new Promise((resolve) =>
    lienzo.toBlob(
      (b) => resolve(b ? new File([b], `${nombre}.jpg`, { type: "image/jpeg" }) : null),
      "image/jpeg",
      0.92,
    ),
  );
}
