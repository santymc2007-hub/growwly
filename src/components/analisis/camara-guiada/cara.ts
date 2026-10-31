/**
 * Detección de la cara en el propio móvil con MediaPipe Face Landmarker.
 * El runtime (WASM) y el modelo se sirven desde Growwly (/mediapipe):
 * el vídeo nunca sale del dispositivo. Se carga solo al abrir la cámara.
 */
import type { FaceLandmarker } from "@mediapipe/tasks-vision";

export type Cara = {
  /** Centro de la cara, 0-1 sobre el fotograma (sin espejo). */
  x: number;
  y: number;
  /** Alto de la cara (frente-barbilla) sobre el alto del fotograma. */
  alto: number;
  /**
   * Giro lateral: posición de la nariz entre las dos mejillas.
   * ≈0,5 de frente; hacia 0 o 1 de perfil.
   */
  giro: number;
  /** Cabeceo: posición de la nariz entre ojos y barbilla (≈0,45 mirando al frente). */
  cabeceo: number;
};

let cargando: Promise<FaceLandmarker> | null = null;

export function cargarDetector(): Promise<FaceLandmarker> {
  if (!cargando) {
    cargando = (async () => {
      const { FaceLandmarker, FilesetResolver } = await import("@mediapipe/tasks-vision");
      const fileset = await FilesetResolver.forVisionTasks("/mediapipe/wasm");
      const crear = (delegate: "GPU" | "CPU") =>
        FaceLandmarker.createFromOptions(fileset, {
          baseOptions: { modelAssetPath: "/mediapipe/face_landmarker.task", delegate },
          runningMode: "VIDEO",
          numFaces: 1,
          minFaceDetectionConfidence: 0.4,
          minTrackingConfidence: 0.4,
        });
      try {
        return await crear("GPU");
      } catch {
        return await crear("CPU");
      }
    })();
    cargando.catch(() => {
      cargando = null;
    });
  }
  return cargando;
}

// Índices del modelo de 468 puntos.
const NARIZ = 1;
const FRENTE = 10;
const BARBILLA = 152;
const MEJILLA_A = 234;
const MEJILLA_B = 454;
const OJO_A = 33;
const OJO_B = 263;

let ultimoTs = 0;

export function detectarCara(detector: FaceLandmarker, video: HTMLVideoElement): Cara | null {
  // detectForVideo exige marcas de tiempo crecientes.
  const ts = Math.max(performance.now(), ultimoTs + 1);
  ultimoTs = ts;
  const r = detector.detectForVideo(video, ts);
  const p = r.faceLandmarks?.[0];
  if (!p) return null;

  const nariz = p[NARIZ];
  const a = p[MEJILLA_A];
  const b = p[MEJILLA_B];
  const frente = p[FRENTE];
  const barbilla = p[BARBILLA];
  const ojosY = (p[OJO_A].y + p[OJO_B].y) / 2;

  let minX = 1;
  let maxX = 0;
  let minY = 1;
  let maxY = 0;
  for (const q of p) {
    if (q.x < minX) minX = q.x;
    if (q.x > maxX) maxX = q.x;
    if (q.y < minY) minY = q.y;
    if (q.y > maxY) maxY = q.y;
  }

  const anchoMejillas = b.x - a.x;
  const giro = Math.abs(anchoMejillas) > 0.001 ? (nariz.x - a.x) / anchoMejillas : 0.5;
  const altoOjosBarbilla = barbilla.y - ojosY;
  const cabeceo = altoOjosBarbilla > 0.001 ? (nariz.y - ojosY) / altoOjosBarbilla : 0.45;

  return {
    x: (minX + maxX) / 2,
    y: (minY + maxY) / 2,
    alto: Math.abs(barbilla.y - frente.y),
    giro: Math.min(1, Math.max(0, giro)),
    cabeceo,
  };
}
