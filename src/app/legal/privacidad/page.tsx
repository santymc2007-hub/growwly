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
        <em>Última actualización: 15 de octubre de 2026.</em>
      </p>

      <h2>1. Responsable del tratamiento</h2>
      <p>
        Santiago Mulet Cortés, con NIF 43139455B y domicilio en calle Joan
        Sastre Prevere, 6, bajos, 07015 Palma (Illes Balears), titular de
        Growwly, es el responsable del tratamiento de los datos personales que
        se recogen a través de este sitio web. Para cualquier cuestión sobre
        privacidad puedes escribir a{" "}
        <a href="mailto:direccion@growwly.es">direccion@growwly.es</a>.
      </p>

      <h2>2. Qué datos tratamos, para qué y con qué base legal</h2>
      <ul>
        <li>
          <strong>Cuenta de paciente:</strong> nombre, apellidos, email,
          teléfono y edad, para crear y gestionar tu cuenta. Base legal:
          ejecución del contrato de uso de la plataforma (art. 6.1.b RGPD).
        </li>
        <li>
          <strong>Valoración capilar orientativa:</strong> las fotografías que
          subas. Como pueden revelar datos de salud, solo las tratamos con tu{" "}
          <strong>consentimiento explícito</strong> (art. 9.2.a RGPD), que te
          pedimos en una casilla antes de subirlas. Las usamos para generar,
          mediante inteligencia artificial, una valoración orientativa que no
          es un diagnóstico médico. Se guardan de forma privada y nunca se
          publican.
        </li>
        <li>
          <strong>Solicitud de presupuesto:</strong> tu historial capilar,
          información de salud, preferencias y presupuesto, para hacer llegar
          tu solicitud a las clínicas que encajen con tu caso. La información
          de salud se trata con tu consentimiento explícito (art. 9.2.a RGPD);
          el resto, para prestarte el servicio que pides (art. 6.1.b RGPD). El
          detalle de cada casilla del formulario está en los{" "}
          <a href="/legal/terminos#consentimientos-del-formulario">
            Términos y Condiciones
          </a>
          .
        </li>
        <li>
          <strong>Avisos y recordatorios:</strong> te escribimos sobre tus
          solicitudes (propuestas de clínicas, citas y cambios), porque es
          parte del servicio (art. 6.1.b RGPD). También te enviamos algún
          recordatorio relacionado con lo que ya usas, como pedir presupuesto
          tras tu valoración o valorar la clínica tras la cita (art. 21.2
          LSSI). Puedes desactivar los recordatorios en tu cuenta o desde el
          enlace de cada email.
        </li>
        <li>
          <strong>Comunicaciones de marketing:</strong> solo si marcas la
          casilla opcional correspondiente (art. 6.1.a RGPD). Puedes darte de
          baja desde tu cuenta o desde el enlace de cada email.
        </li>
        <li>
          <strong>Cuenta de clínica:</strong> los datos de contacto de la
          persona que gestiona la clínica y los datos de facturación de
          referencia, para gestionar su perfil, sus solicitudes y la relación
          comercial (art. 6.1.b RGPD).
        </li>
        <li>
          <strong>Información pública de clínicas:</strong> nombre, dirección,
          teléfono, web, horarios, valoraciones y nombres de los profesionales
          que la propia clínica publica, obtenidos de fuentes públicas como su
          web o Google, para mostrar el directorio. Base legal: interés
          legítimo en ofrecer un directorio completo (art. 6.1.f RGPD). La
          clínica puede pedir en cualquier momento que corrijamos o retiremos
          su ficha.
        </li>
        <li>
          <strong>Seguridad y uso de la web:</strong> una huella cifrada de tu
          dirección IP para limitar abusos (por ejemplo, el número de análisis
          por hora), y datos de navegación si aceptas las cookies de
          analítica. Base legal: interés legítimo en proteger el servicio (art.
          6.1.f RGPD) y, en el caso de la analítica, tu consentimiento. Más
          detalle en la <a href="/legal/cookies">Política de Cookies</a>.
        </li>
      </ul>
      <p>
        Growwly es solo para mayores de 18 años. No tratamos
        conscientemente datos de menores; si detectamos que una cuenta
        pertenece a un menor, la eliminamos.
      </p>

      <h2>3. Inicio de sesión con Google</h2>
      <p>
        Si eliges entrar con tu cuenta de Google, Google nos facilita tu
        nombre, email y foto de perfil, y lo usamos solo para crear o
        identificar tu cuenta en Growwly.
      </p>

      <h2>4. Decisiones automatizadas</h2>
      <p>
        La valoración orientativa y la selección de las clínicas a las que se
        envía tu solicitud se hacen de forma automatizada (inteligencia
        artificial y reglas de encaje por ubicación, tratamiento y
        presupuesto). Ninguna de ellas produce efectos jurídicos sobre ti ni
        te afecta de forma significativa: la decisión sobre cualquier
        tratamiento la tomas tú con un médico, y puedes elegir libremente con
        qué clínica continuar o no continuar con ninguna.
      </p>

      <h2>5. A quién comunicamos tus datos</h2>
      <p>
        <strong>Clínicas.</strong> Cuando envías una solicitud de presupuesto,
        las clínicas seleccionadas reciben un resumen de tu caso, tu
        valoración y tus fotos, sin tu nombre ni tus datos de contacto. Esos
        datos solo se revelan a la clínica con la que decides continuar. A
        partir de ese momento, esa clínica trata tus datos como responsable
        independiente, conforme a su propia política de privacidad y a la
        normativa sanitaria.
      </p>
      <p>
        <strong>Proveedores tecnológicos.</strong> Para prestar el servicio
        usamos proveedores que actúan como encargados del tratamiento, bajo
        contrato y solo siguiendo nuestras instrucciones:
      </p>
      <ul>
        <li>
          Supabase (base de datos, cuentas y almacenamiento de fotos), con los
          datos alojados en la Unión Europea (Frankfurt, Alemania).
        </li>
        <li>Vercel (alojamiento de la web), Estados Unidos.</li>
        <li>Resend (envío de emails), Estados Unidos.</li>
        <li>
          Anthropic (análisis de las fotos mediante inteligencia artificial),
          Estados Unidos.
        </li>
        <li>
          Google (analítica web si la aceptas e inicio de sesión con
          Google), Estados Unidos.
        </li>
        <li>
          Microsoft (Clarity: cómo se navega por la web, si aceptas las
          cookies analíticas), Estados Unidos. No registra lo que escribes y
          las páginas con datos de salud o de tu cuenta se ocultan.
        </li>
        <li>
          OpenStreetMap Foundation (imágenes de los mapas de clínicas), Reino
          Unido: al cargar un mapa, tu navegador le pide las imágenes y recibe
          tu dirección IP.
        </li>
      </ul>
      <p>
        No vendemos tus datos ni los cedemos a terceros con fines
        comerciales. Solo los comunicaremos a autoridades cuando una ley nos
        obligue.
      </p>

      <h2>6. Transferencias internacionales</h2>
      <p>
        Algunos de los proveedores anteriores están en Estados Unidos. Esas
        transferencias se amparan en la decisión de adecuación de la Comisión
        Europea para el Marco de Privacidad de Datos UE-EE. UU. (Data Privacy
        Framework), cuando el proveedor está adherido, o en las cláusulas
        contractuales tipo aprobadas por la Comisión Europea. Puedes pedirnos
        más información sobre estas garantías en{" "}
        <a href="mailto:direccion@growwly.es">direccion@growwly.es</a>.
      </p>

      <h2>7. Cuánto tiempo conservamos tus datos</h2>
      <ul>
        <li>
          <strong>Cuenta de paciente:</strong> mientras esté activa. Si la
          borras, eliminamos tus datos en un plazo máximo de 30 días.
        </li>
        <li>
          <strong>Valoraciones vinculadas a tu cuenta y sus fotos:</strong>{" "}
          hasta que las borres o borres tu cuenta.
        </li>
        <li>
          <strong>Valoraciones hechas sin cuenta</strong> que no se guardan en
          ninguna cuenta: 6 meses desde su creación.
        </li>
        <li>
          <strong>Solicitudes de presupuesto:</strong> 2 años desde su envío,
          salvo que las borres antes.
        </li>
        <li>
          <strong>Datos de clínicas y facturación:</strong> mientras dure la
          relación y, después, el tiempo que exija la normativa fiscal y
          mercantil (hasta 6 años).
        </li>
        <li>
          <strong>Huella de IP para limitar abusos:</strong> el tiempo
          necesario para ese control, nunca más de 6 meses.
        </li>
      </ul>
      <p>
        Pasados esos plazos, los datos se eliminan o se anonimizan de forma
        que ya no puedan asociarse a ti.
      </p>

      <h2>8. Tus derechos</h2>
      <p>
        Puedes ejercer tus derechos de acceso, rectificación, supresión,
        oposición, limitación y portabilidad escribiendo a{" "}
        <a href="mailto:direccion@growwly.es">direccion@growwly.es</a>.
        También puedes retirar en cualquier momento los consentimientos que
        hayas dado, sin que eso afecte a lo tratado antes de retirarlos: por
        ejemplo, borrando tu valoración y sus fotos desde{" "}
        <a href="/cuenta">Mi cuenta</a>. Si consideras que el tratamiento no
        se ajusta a la normativa, puedes reclamar ante la Agencia Española de
        Protección de Datos (<a href="https://www.aepd.es">www.aepd.es</a>).
      </p>

      <h2>9. Seguridad</h2>
      <p>
        Aplicamos medidas técnicas y organizativas para proteger tus datos
        frente a accesos no autorizados, pérdida o alteración: las fotos se
        guardan en almacenamiento privado, las conexiones van cifradas y el
        acceso a los datos de salud está restringido.
      </p>

      <h2>10. Cambios en esta política</h2>
      <p>
        Si cambiamos esta política de forma relevante, lo avisaremos en la web
        y, si tienes cuenta, por email.
      </p>
    </LegalLayout>
  );
}
