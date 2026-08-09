import type { Metadata } from "next";
import { LegalLayout } from "@/components/legal/legal-layout";

export const metadata: Metadata = {
  title: "Política de Privacidad",
  alternates: { canonical: "/legal/privacidad" },
};

export default function PrivacidadPage() {
  return (
    <LegalLayout activo="/legal/privacidad">
      <h1>Política de Privacidad</h1>
      <p>
        <em>
          Plantilla de partida — sustituye los datos entre corchetes y haz
          que un abogado especializado en protección de datos la revise
          antes de publicarla con carácter definitivo. Dado que la
          plataforma trata fotografías relacionadas con el aspecto capilar
          de las personas, conviene una revisión específica sobre si algún
          dato tratado debe considerarse categoría especial según el RGPD.
        </em>
      </p>

      <h2>1. Responsable del tratamiento</h2>
      <p>
        [NOMBRE LEGAL DE LA EMPRESA], con NIF/CIF [NÚMERO] y domicilio en
        [DIRECCIÓN COMPLETA], es responsable del tratamiento de los datos
        personales que se recogen a través de este sitio web. Contacto:
        [email@dominio.com].
      </p>

      <h2>2. Qué datos tratamos y con qué finalidad</h2>
      <ul>
        <li>
          <strong>Cuenta de paciente:</strong> nombre, apellidos, email,
          teléfono y edad, para poder crear y gestionar tu cuenta.
        </li>
        <li>
          <strong>Análisis capilar orientativo:</strong> las fotografías que
          subas, para generar una primera impresión orientativa mediante
          inteligencia artificial. Estas fotografías se almacenan de forma
          privada y no se muestran públicamente.
        </li>
        <li>
          <strong>Solicitud de presupuesto:</strong> los datos de tu
          historial capilar, preferencias y presupuesto que indiques en el
          formulario, para poder trasladar tu solicitud a las clínicas que
          mejor encajen con tu caso.
        </li>
        <li>
          <strong>Cuenta de clínica:</strong> los datos de contacto y de la
          clínica que representes, para gestionar tu perfil en el
          directorio y las solicitudes que te lleguen.
        </li>
      </ul>

      <h2>3. Base legal</h2>
      <p>
        El tratamiento se basa en la ejecución del contrato de prestación
        del servicio (tu registro y uso de la plataforma) y, para la
        compartición de tu solicitud con clínicas, en tu consentimiento
        explícito, que se solicita de forma expresa en el propio
        formulario.
      </p>

      <h2>4. A quién comunicamos tus datos</h2>
      <p>
        Cuando envías una solicitud de presupuesto, un resumen de tu caso
        (sin tus datos de contacto) se comparte con las clínicas que
        encajen con tu perfil. Tus datos de contacto solo se revelan a la
        clínica en el momento en que decides continuar con ella. Además,
        usamos proveedores tecnológicos para poder prestar el servicio
        (alojamiento de datos y fotos, envío de emails, análisis de
        imágenes mediante IA) que actúan como encargados del tratamiento
        bajo contrato.
      </p>

      <h2>5. Plazo de conservación</h2>
      <p>
        Conservamos tus datos mientras mantengas tu cuenta activa. Puedes
        solicitar la eliminación de tu cuenta y tus datos en cualquier
        momento a través de [email@dominio.com].
      </p>

      <h2>6. Tus derechos</h2>
      <p>
        Puedes ejercer tus derechos de acceso, rectificación, supresión,
        oposición, limitación y portabilidad de tus datos escribiendo a
        [email@dominio.com]. También tienes derecho a presentar una
        reclamación ante la Agencia Española de Protección de Datos
        (www.aepd.es) si consideras que el tratamiento no se ajusta a la
        normativa.
      </p>

      <h2>7. Seguridad</h2>
      <p>
        Aplicamos medidas técnicas y organizativas razonables para proteger
        tus datos frente a accesos no autorizados, pérdida o alteración.
      </p>
    </LegalLayout>
  );
}
