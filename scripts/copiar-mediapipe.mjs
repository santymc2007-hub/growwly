// Copia el runtime WASM de MediaPipe (detección de la cara en la
// valoración con cámara guiada) a /public para servirlo desde Growwly,
// sin depender de un CDN externo. Se ejecuta en cada `npm install`
// (también en Vercel). Los .wasm pesan ~14 MB: no se suben a git.
import { cpSync, existsSync, mkdirSync } from "node:fs";

const origen = "node_modules/@mediapipe/tasks-vision/wasm";
const destino = "public/mediapipe/wasm";
if (existsSync(origen)) {
  mkdirSync(destino, { recursive: true });
  for (const f of [
    "vision_wasm_internal.js",
    "vision_wasm_internal.wasm",
    "vision_wasm_nosimd_internal.js",
    "vision_wasm_nosimd_internal.wasm",
  ]) {
    cpSync(`${origen}/${f}`, `${destino}/${f}`);
  }
}
