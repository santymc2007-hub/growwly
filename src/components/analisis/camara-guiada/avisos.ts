/**
 * Avisos que no necesitan mirar la pantalla (coronilla y nuca con la
 * cámara mirando a la cabeza): voz, pitidos y vibración. En iOS la voz y el audio
 * solo funcionan si se "desbloquean" dentro de un toque del usuario:
 * por eso `activar()` se llama desde el botón que abre ese paso.
 */

let audio: AudioContext | null = null;
let ultimaFrase = "";
let ultimaVez = 0;

export function activarAvisos() {
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (Ctx && !audio) audio = new Ctx();
    void audio?.resume();
  } catch {
    audio = null;
  }
  try {
    // Frase vacía para desbloquear la síntesis de voz en Safari.
    const u = new SpeechSynthesisUtterance(" ");
    u.volume = 0;
    window.speechSynthesis?.speak(u);
  } catch {
    // sin voz: quedan los pitidos y la vibración
  }
}

/** Dice la frase en voz alta; no repite la misma frase antes de `cada` ms. */
export function decir(frase: string, cada = 3500) {
  const ahora = Date.now();
  if (frase === ultimaFrase && ahora - ultimaVez < cada) return;
  ultimaFrase = frase;
  ultimaVez = ahora;
  try {
    const s = window.speechSynthesis;
    if (!s) return;
    s.cancel();
    const u = new SpeechSynthesisUtterance(frase);
    u.lang = "es-ES";
    u.rate = 1.05;
    s.speak(u);
  } catch {
    // nada
  }
}

export function callar() {
  try {
    window.speechSynthesis?.cancel();
  } catch {
    // nada
  }
  ultimaFrase = "";
}

export function pitido(frecuencia = 880, duracion = 0.09) {
  if (!audio) return;
  try {
    const o = audio.createOscillator();
    const g = audio.createGain();
    o.frequency.value = frecuencia;
    g.gain.setValueAtTime(0.15, audio.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + duracion);
    o.connect(g).connect(audio.destination);
    o.start();
    o.stop(audio.currentTime + duracion);
  } catch {
    // nada
  }
}

export function vibrar(patron: number | number[] = 120) {
  try {
    navigator.vibrate?.(patron);
  } catch {
    // iOS no vibra desde la web
  }
}
