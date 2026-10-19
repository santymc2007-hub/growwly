import type { Metadata } from "next";
import Link from "next/link";
import { LegalLayout } from "@/components/legal/legal-layout";
import { GROWWLY_SCORE_WEIGHTS } from "@/lib/leads/growwly-score";

export const metadata: Metadata = {
  title: "Cómo ordenamos los centros",
  description:
    "Qué decide el orden de los centros en Growwly, qué posiciones son de pago y a qué clínicas llega tu solicitud de presupuesto.",
  alternates: { canonical: "/como-ordenamos" },
};

const pct = (n: number) => `${Math.round(n * 100)} %`;

/**
 * Transparencia de clasificación exigida por la Directiva Ómnibus de
 * consumo (UE 2019/2161, art. 7.4 bis de la Directiva 2005/29) y el
 * Reglamento P2B. Debe describir el código tal y como funciona: si
 * cambia el orden de /centros, de la ciudad, de la portada o el reparto
 * de solicitudes (lib/leads/notificar-clinicas.ts), actualizar esta
 * página en el mismo cambio.
 */
export default function ComoOrdenamosPage() {
  const w = GROWWLY_SCORE_WEIGHTS;

  return (
    <LegalLayout activo="/como-ordenamos">
      <h1>Cómo ordenamos los centros</h1>
      <p>
        <em>Última actualización: 19 de octubre de 2026.</em>
      </p>
      <p>
        Growwly es gratuito para pacientes. Lo pagan los centros: algunos
        pagan por aparecer más arriba o por recibir solicitudes. Aquí te
        explicamos qué es de pago y qué no, para que sepas por qué ves cada
        centro donde lo ves.
      </p>

      <h2>Qué centros aparecen</h2>
      <p>
        Solo los centros publicados y revisados por Growwly. Revisar quiere
        decir que hemos comprobado que el centro existe y que sus datos de
        contacto son correctos (la etiqueta «Verificada»). No es una
        valoración de su calidad médica.
      </p>

      <h2>Posiciones de pago: «Destacado»</h2>
      <p>
        Hay dos posiciones de pago. Los centros que las tienen llevan
        siempre la etiqueta <strong>«Destacado»</strong> en su tarjeta.
        Pagar no cambia lo que dice la ficha ni las valoraciones.
      </p>
      <ul>
        <li>
          <strong>Destacado general</strong> (como máximo 8 centros en toda
          España): sale en la sección «Centros destacados» de la portada y
          primero en el listado de centros mientras no elijas provincia.
        </li>
        <li>
          <strong>Destacado de provincia</strong> (como máximo 8 centros por
          provincia): sale primero cuando buscas en esa provincia o en una de
          sus ciudades.
        </li>
      </ul>
      <p>
        Los demás filtros (tratamiento, tipo de centro, idioma…) solo dejan
        fuera a los destacados que no los cumplen. Entre los destacados, el
        orden cambia cada día, para que ninguno ocupe siempre el primer
        puesto.
      </p>
      <p>
        Si no hay suficientes centros destacados para llenar esa sección de la
        portada, completamos los huecos con centros verificados elegidos al
        azar cada día. Esos centros no pagan y no llevan etiqueta.
      </p>
      <p>
        El «Centro de la semana» de la portada rota entre centros con Perfil
        detallado (servicio de pago) que tienen la ficha completa al menos en
        un 60 %.
      </p>

      <h2>El resto del orden</h2>
      <p>
        En todos los listados (el general, el de cada ciudad y el de cada
        tratamiento), después de los centros destacados, ordenamos por la
        puntuación Growwly, que mide:
      </p>
      <ul>
        <li>Ficha completa (fotos, horarios, equipo, información…): {pct(w.perfilCompleto)}.</li>
        <li>Rapidez en responder a los pacientes: {pct(w.tiempoRespuesta)}.</li>
        <li>Cómo gestiona las solicitudes que recibe: {pct(w.gestionLeads)}.</li>
        <li>
          Ventajas para el paciente (oferta, primera consulta gratis,
          financiación, videoconsulta): {pct(w.ofertasActivas)}.
        </li>
        <li>Valoración media en Google: {pct(w.googleRating)}.</li>
      </ul>
      <p>
        Ten en cuenta que los centros con Perfil detallado (de pago) pueden
        mostrar más contenido, como equipo médico, vídeo, fotos de antes y
        después u ofertas, y eso suma en «ficha completa» y «ventajas». Los
        que todavía no reciben solicitudes puntúan con un valor neutro en
        rapidez y gestión.
      </p>
      <p>
        A igual puntuación, por orden alfabético. Los filtros (ciudad,
        técnica, idioma, financiación…) los eliges tú y solo dejan fuera los
        centros que no los cumplen.
      </p>

      <h2>A qué centros llega tu solicitud de presupuesto</h2>
      <p>
        Cuando pides presupuesto desde el formulario general, tu solicitud
        llega a un máximo de 5 centros colaboradores (con Perfil detallado)
        que ofrecen el tratamiento que buscas y, si lo indicas, en tu ciudad.
        Entre ellos damos prioridad a los que este mes han recibido menos
        solicitudes, para repartirlas, y después a los de mejor puntuación
        Growwly. Los centros solo ven tu nombre y contacto si tú
        los eliges.
      </p>
      <p>
        Si pides cita a un centro concreto desde su ficha, la petición va a
        ese centro. Si en 48 horas no te ha respondido, te avisamos y te
        proponemos otros centros parecidos de tu zona.
      </p>

      <h2>Valoraciones y opiniones</h2>
      <p>
        La nota con estrellas es la media pública de Google y la mostramos tal
        cual, igual que las reseñas de Google de cada ficha, que llevan la
        etiqueta «Reseña de Google». Algunas fichas incluyen además opiniones
        que ha añadido el propio centro: van marcadas como «Aportada por el
        centro» y Growwly no las ha verificado.
      </p>

      <p>
        ¿Dudas o algo que no cuadra? Escríbenos a{" "}
        <a href="mailto:direccion@growwly.es">direccion@growwly.es</a>. Más
        información en los <Link href="/legal/terminos">Términos</Link>.
      </p>
    </LegalLayout>
  );
}
