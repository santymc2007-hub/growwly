/**
 * INTERRUPTOR GENERAL de las animaciones de entrada (carga + scroll).
 *
 * Ponerlo a `false` las apaga en toda la web de golpe: sin la clase
 * "anim" en <html>, todos los atributos data-reveal / data-reveal-grupo
 * y la clase .entra dejan de tener efecto y todo aparece como antes.
 *
 * Rama de respaldo con la web tal cual estaba antes: `pre-animaciones`.
 */
export const ANIMACIONES_ACTIVAS = true;

/**
 * Script que va en el <head>, antes de pintar nada: activa "anim" en
 * <html> solo si el usuario no tiene pedido "reducir movimiento" en su
 * sistema. Si el componente RevealObserver no llega a arrancar en 4 s
 * (error de JS, red lentísima…), quita la clase para que nunca quede
 * contenido oculto.
 */
export const SCRIPT_ANIMACIONES = `(function(){try{
var d=document.documentElement;
if(window.matchMedia("(prefers-reduced-motion: reduce)").matches||!("IntersectionObserver" in window))return;
d.classList.add("anim");
setTimeout(function(){if(!d.dataset.animReady)d.classList.remove("anim");},4000);
}catch(e){}})();`;
