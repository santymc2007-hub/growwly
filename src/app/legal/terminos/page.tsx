import type { Metadata } from "next";
import { LegalLayout } from "@/components/legal/legal-layout";

export const metadata: Metadata = {
  title: "Términos y Condiciones",
  alternates: { canonical: "/legal/terminos" },
};

export default function TerminosPage() {
  return (
    <LegalLayout activo="/legal/terminos">
      <h1>Términos y Condiciones</h1>
      <p>
        <em>
          Plantilla de partida — haz que un abogado la revise antes de
          publicarla con carácter definitivo, especialmente en lo referente
          a las condiciones comerciales con las clínicas.
        </em>
      </p>

      <h2>1. Objeto</h2>
      <p>
        Estos Términos y Condiciones regulan el acceso y uso de Growwly, un
        directorio online de clínicas especializadas en salud capilar en
        España, así como los servicios de análisis orientativo y solicitud
        de presupuesto que ofrece.
      </p>

      <h2>2. Registro de usuarios</h2>
      <p>
        Para usar determinadas funciones (guardar un análisis, solicitar
        presupuesto) es necesario registrarse con datos veraces. El usuario
        es responsable de la custodia de su contraseña y de la actividad
        realizada desde su cuenta.
      </p>

      <h2>3. El análisis orientativo con inteligencia artificial</h2>
      <p>
        Growwly ofrece, a partir de fotografías subidas voluntariamente por
        el usuario, una primera impresión orientativa sobre el aspecto
        capilar generada mediante inteligencia artificial.{" "}
        <strong>
          Esto no es un diagnóstico médico ni sustituye la valoración
          presencial de un profesional sanitario.
        </strong>{" "}
        Cualquier decisión sobre tratamiento debe tomarse siempre en
        consulta con una clínica o especialista cualificado.
      </p>

      <h2>4. Solicitud de presupuesto</h2>
      <p>
        Al enviar una solicitud de presupuesto, el usuario autoriza a
        Growwly a compartir un resumen de su caso con las clínicas del
        directorio que encajen con su perfil, con el único fin de que
        puedan ofrecerle una valoración u oferta comercial. Growwly actúa
        como intermediario tecnológico y no es parte del contrato que, en
        su caso, se formalice entre el usuario y la clínica.
      </p>

      <h2 id="consentimientos-del-formulario">
        5. Consentimientos del formulario de solicitud de presupuesto
      </h2>
      <p>
        El formulario de solicitud de presupuesto pide varios
        consentimientos por separado, en vez de uno solo genérico, porque
        cada uno cubre un tratamiento de datos distinto y el usuario debe
        poder entender y decidir sobre cada uno de forma específica e
        informada, tal como exige el RGPD. A continuación se explica en
        detalle qué implica cada casilla:
      </p>
      <ul>
        <li>
          <a href="#politica-de-privacidad">5.1 Política de privacidad</a>
        </li>
        <li>
          <a href="#informacion-medica">5.2 Información médica</a>
        </li>
        <li>
          <a href="#uso-de-fotografias">5.3 Uso de fotografías</a>
        </li>
        <li>
          <a href="#comunicaciones-de-clinicas">
            5.4 Comunicaciones de clínicas
          </a>
        </li>
        <li>
          <a href="#comunicaciones-marketing">
            5.5 Comunicaciones de marketing por email
          </a>
        </li>
        <li>
          <a href="#terminos-de-servicio">5.6 Términos de servicio</a>
        </li>
      </ul>

      <h3 id="politica-de-privacidad">5.1 Política de privacidad</h3>
      <p>
        Al marcar esta casilla, el usuario confirma que ha leído y acepta
        nuestra{" "}
        <a href="/legal/privacidad">Política de Privacidad</a>, que detalla
        qué datos personales tratamos (identificativos, de contacto y de
        uso de la plataforma), con qué finalidad, durante cuánto tiempo y
        qué derechos puede ejercer en cualquier momento (acceso,
        rectificación, supresión, oposición, limitación y portabilidad). La
        base legal de este tratamiento es la ejecución del contrato de
        prestación del servicio que el usuario solicita al crear su cuenta
        y enviar la solicitud de presupuesto (art. 6.1.b RGPD).
      </p>

      <h3 id="informacion-medica">5.2 Información médica</h3>
      <p>
        El formulario recoge datos sobre el estado de salud del usuario
        (progresión de la caída, antecedentes familiares, medicación
        actual, síntomas del cuero cabelludo, tratamientos ya probados,
        cambios de salud recientes, alergias, condiciones médicas, cirugías
        previas y hábito de fumar). Se trata de{" "}
        <strong>datos de categoría especial</strong> conforme al artículo 9
        del RGPD, y por eso este consentimiento se pide de forma expresa y
        separada del resto: su base legal no es la ejecución del contrato,
        sino el <strong>consentimiento explícito</strong> del usuario (art.
        9.2.a RGPD).
      </p>
      <p>
        Al marcar esta casilla, el usuario (i) confirma que la información
        médica que ha proporcionado es veraz y completa a su leal saber y
        entender, y (ii) autoriza que esos datos se compartan
        exclusivamente con las clínicas a las que se dirija su solicitud,
        con el único fin de que puedan valorar médicamente si el
        tratamiento solicitado es adecuado para su caso antes de responder
        con una propuesta. Estos datos no se ceden a terceros ajenos a esa
        finalidad ni se usan con fines comerciales o estadísticos fuera de
        la propia solicitud.
      </p>

      <h3 id="uso-de-fotografias">5.3 Uso de fotografías</h3>
      <p>
        Las fotografías que el usuario sube (para el análisis orientativo
        con IA o vinculadas a una solicitud de presupuesto) se usan
        exclusivamente para (i) generar la primera impresión orientativa
        mediante inteligencia artificial, y (ii) permitir que las clínicas
        a las que se dirige la solicitud puedan valorar visualmente el
        caso, cuando el usuario vincula un análisis a su solicitud.
      </p>
      <p>
        Estas fotografías <strong>nunca se publican</strong> ni se usan con
        fines de marketing o promoción de Growwly, y no se comparten con
        nadie más allá de la o las clínicas relevantes para esa solicitud y
        los proveedores tecnológicos que actúan como encargados del
        tratamiento (alojamiento y análisis de imagen mediante IA), bajo
        contrato de confidencialidad. El usuario puede retirar este
        consentimiento en cualquier momento borrando su análisis desde{" "}
        <a href="/cuenta">Mi cuenta</a>, lo que elimina también las
        fotografías asociadas.
      </p>

      <h3 id="comunicaciones-de-clinicas">5.4 Comunicaciones de clínicas</h3>
      <p>
        Al marcar esta casilla, el usuario autoriza a que las clínicas
        cuyo perfil encaje con su solicitud se pongan en contacto con él
        para presentarle una propuesta u oferta relacionada con el
        tratamiento solicitado. Inicialmente las clínicas solo ven un
        resumen de la solicitud (historial capilar, preferencias y
        presupuesto), sin nombre, teléfono ni email — estos datos de
        contacto solo se revelan a la clínica que el usuario elija
        finalmente para seguir adelante. Esta es la finalidad esencial del
        servicio que el usuario solicita, por lo que su base legal es la
        ejecución del contrato (art. 6.1.b RGPD).
      </p>

      <h3 id="comunicaciones-marketing">
        5.5 Comunicaciones de marketing por email
      </h3>
      <p>
        Esta casilla es <strong>independiente y opcional</strong> — no
        tiene relación con el envío de la solicitud de presupuesto ni con
        el resto de consentimientos de este formulario, y viene desmarcada
        por defecto. Si el usuario la marca, autoriza a Growwly a enviarle
        por email contenido de tipo informativo y comercial: novedades
        sobre salud capilar, nuevas clínicas incorporadas al directorio y
        ofertas o promociones. La base legal de este tratamiento es el
        consentimiento del usuario (art. 6.1.a RGPD), conforme también a lo
        exigido por el artículo 21 de la Ley de Servicios de la Sociedad de
        la Información (LSSI-CE) para el envío de comunicaciones
        comerciales electrónicas.
      </p>
      <p>
        El usuario puede retirar este consentimiento en cualquier momento,
        de dos formas igual de válidas: desde el apartado correspondiente
        en <a href="/cuenta">Mi cuenta</a>, o pulsando el enlace de baja
        que incluye cada email enviado. Retirarlo no afecta en ningún caso
        a la prestación del resto de servicios de Growwly (cuenta, análisis
        orientativo, solicitudes de presupuesto).
      </p>

      <h3 id="terminos-de-servicio">5.6 Términos de servicio</h3>
      <p>
        Al marcar esta casilla, el usuario declara haber leído y aceptado
        este documento de Términos y Condiciones en su totalidad.
      </p>

      <h2>6. Condiciones para clínicas</h2>
      <p>
        Las clínicas que se registran en Growwly se comprometen a aportar
        información veraz y actualizada sobre sus servicios. El alta de una
        cuenta de clínica está sujeta a validación manual por parte de
        Growwly. Las condiciones económicas de los distintos planes y
        servicios (visibilidad destacada, acceso a solicitudes de
        presupuesto, etc.) se detallan en el propio panel de la clínica y
        pueden ser modificadas previo aviso.
      </p>

      <h2>7. Propiedad intelectual</h2>
      <p>
        Los contenidos, marca y diseño de Growwly están protegidos por
        derechos de propiedad intelectual e industrial. El contenido que
        las clínicas suben a su ficha (fotos, descripciones) sigue siendo
        de su titularidad, y al publicarlo autorizan a Growwly a mostrarlo
        en la plataforma.
      </p>

      <h2>8. Limitación de responsabilidad</h2>
      <p>
        Growwly no garantiza la disponibilidad continua del servicio ni se
        responsabiliza de los resultados de los tratamientos contratados
        con las clínicas del directorio. El uso de la plataforma es bajo
        responsabilidad del usuario.
      </p>

      <h2>9. Modificación de los términos</h2>
      <p>
        Growwly puede modificar estos términos en cualquier momento. Los
        cambios se publicarán en esta misma página.
      </p>

      <h2>10. Legislación aplicable</h2>
      <p>
        Estos términos se rigen por la legislación española.
      </p>
    </LegalLayout>
  );
}
