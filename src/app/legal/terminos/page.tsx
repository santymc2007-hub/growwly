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

      <h2>5. Condiciones para clínicas</h2>
      <p>
        Las clínicas que se registran en Growwly se comprometen a aportar
        información veraz y actualizada sobre sus servicios. El alta de una
        cuenta de clínica está sujeta a validación manual por parte de
        Growwly. Las condiciones económicas de los distintos planes y
        servicios (visibilidad destacada, acceso a solicitudes de
        presupuesto, etc.) se detallan en el propio panel de la clínica y
        pueden ser modificadas previo aviso.
      </p>

      <h2>6. Propiedad intelectual</h2>
      <p>
        Los contenidos, marca y diseño de Growwly están protegidos por
        derechos de propiedad intelectual e industrial. El contenido que
        las clínicas suben a su ficha (fotos, descripciones) sigue siendo
        de su titularidad, y al publicarlo autorizan a Growwly a mostrarlo
        en la plataforma.
      </p>

      <h2>7. Limitación de responsabilidad</h2>
      <p>
        Growwly no garantiza la disponibilidad continua del servicio ni se
        responsabiliza de los resultados de los tratamientos contratados
        con las clínicas del directorio. El uso de la plataforma es bajo
        responsabilidad del usuario.
      </p>

      <h2>8. Modificación de los términos</h2>
      <p>
        Growwly puede modificar estos términos en cualquier momento. Los
        cambios se publicarán en esta misma página.
      </p>

      <h2>9. Legislación aplicable</h2>
      <p>
        Estos términos se rigen por la legislación española.
      </p>
    </LegalLayout>
  );
}
