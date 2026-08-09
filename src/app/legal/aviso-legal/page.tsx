import type { Metadata } from "next";
import { LegalLayout } from "@/components/legal/legal-layout";

export const metadata: Metadata = {
  title: "Aviso Legal",
  alternates: { canonical: "/legal/aviso-legal" },
};

export default function AvisoLegalPage() {
  return (
    <LegalLayout activo="/legal/aviso-legal">
      <h1>Aviso Legal</h1>
      <p>
        <em>
          Plantilla de partida — sustituye los datos entre corchetes por los
          reales de tu empresa y haz que un abogado la revise antes de
          publicarla con carácter definitivo.
        </em>
      </p>

      <h2>1. Datos identificativos</h2>
      <p>
        En cumplimiento del artículo 10 de la Ley 34/2002, de 11 de julio, de
        Servicios de la Sociedad de la Información y de Comercio Electrónico
        (LSSI-CE), se informa de los siguientes datos: el presente sitio web,
        accesible en [URL DEL DOMINIO], es titularidad de [NOMBRE LEGAL DE LA
        EMPRESA / AUTÓNOMO], con NIF/CIF [NÚMERO], domicilio en [DIRECCIÓN
        COMPLETA], [inscrita en el Registro Mercantil de (provincia), tomo
        (X), folio (X), hoja (X) — si aplica]. Email de contacto:
        [email@dominio.com].
      </p>

      <h2>2. Objeto</h2>
      <p>
        Growwly es un directorio online de clínicas especializadas en salud
        capilar en España. A través de la plataforma, los usuarios pueden
        consultar información sobre clínicas, recibir una primera impresión
        orientativa (no un diagnóstico médico) a partir de fotografías, y
        solicitar presupuestos que se hacen llegar a las clínicas que
        encajen con su perfil.
      </p>

      <h2>3. Condiciones de uso</h2>
      <p>
        El acceso y uso de este sitio web atribuye la condición de usuario y
        supone la aceptación de las condiciones incluidas en este Aviso
        Legal, en los <a href="/legal/terminos">Términos y Condiciones</a> y
        en la <a href="/legal/privacidad">Política de Privacidad</a>. El
        usuario se compromete a hacer un uso adecuado de los contenidos y
        servicios que se ofrecen, y a no emplearlos para incurrir en
        actividades ilícitas, ilegales o contrarias a la buena fe.
      </p>

      <h2>4. Propiedad intelectual e industrial</h2>
      <p>
        Todos los contenidos del sitio (textos, imágenes, marca, logotipo,
        diseño y código fuente) son propiedad de [NOMBRE DE LA EMPRESA] o de
        terceros que han autorizado su uso, y están protegidos por la
        normativa de propiedad intelectual e industrial. Queda prohibida su
        reproducción, distribución o transformación sin autorización
        expresa.
      </p>

      <h2>5. Exclusión de responsabilidad</h2>
      <p>
        El análisis orientativo que ofrece la plataforma a partir de
        fotografías se genera mediante inteligencia artificial y{" "}
        <strong>no constituye en ningún caso un diagnóstico médico</strong>.
        Growwly no participa en la relación médico-paciente entre el usuario
        y la clínica, y no se responsabiliza de los tratamientos,
        presupuestos o resultados ofrecidos por las clínicas que figuran en
        el directorio.
      </p>

      <h2>6. Legislación aplicable</h2>
      <p>
        Las presentes condiciones se rigen por la legislación española. Para
        cualquier controversia derivada del acceso o uso de este sitio web,
        las partes se someten a los juzgados y tribunales de [CIUDAD], salvo
        que la normativa de consumidores establezca otro fuero.
      </p>
    </LegalLayout>
  );
}
