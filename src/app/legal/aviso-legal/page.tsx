import type { Metadata } from "next";
import { LegalLayout } from "@/components/legal/legal-layout";

export const metadata: Metadata = {
  title: "Aviso legal",
  description:
    "Aviso legal de Growwly: titular del sitio web, condiciones de uso, propiedad intelectual y responsabilidad sobre la información del directorio capilar.",
  alternates: { canonical: "/legal/aviso-legal" },
};

export default function AvisoLegalPage() {
  return (
    <LegalLayout activo="/legal/aviso-legal">
      <h1>Aviso Legal</h1>
      <h2>1. Datos identificativos</h2>
      <p>
        En cumplimiento del artículo 10 de la Ley 34/2002, de 11 de julio, de
        Servicios de la Sociedad de la Información y de Comercio Electrónico
        (LSSI-CE), se informa de los siguientes datos: el presente sitio web,
        accesible en growwly.es, es titularidad de Santiago Mulet Cortés,
        con NIF 43139455B y domicilio en calle Joan Sastre Prevere, 6, bajos,
        07015 Palma (Illes Balears). Email de contacto:{" "}
        <a href="mailto:hola@growwly.es">hola@growwly.es</a>.
      </p>

      <h2>2. Objeto</h2>
      <p>
        Growwly es un directorio online de clínicas especializadas en salud
        capilar en España. A través de la plataforma, los usuarios pueden
        consultar información sobre clínicas, recibir una valoración
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
        diseño y código fuente) son propiedad del titular de Growwly o de
        terceros que han autorizado su uso, y están protegidos por la
        normativa de propiedad intelectual e industrial. Queda prohibida su
        reproducción, distribución o transformación sin autorización
        expresa.
      </p>

      <h2>5. Exclusión de responsabilidad</h2>
      <p>
        La valoración orientativa que ofrece la plataforma a partir de
        fotografías se genera mediante inteligencia artificial y{" "}
        <strong>no constituye en ningún caso un diagnóstico médico</strong>,
        ni una indicación o prescripción de tratamiento. Growwly no es un
        centro sanitario, no presta servicios sanitarios y no participa en la
        relación médico-paciente entre el usuario y la clínica. Growwly no se
        responsabiliza de los tratamientos, presupuestos o resultados
        ofrecidos por las clínicas que figuran en el directorio, que son las
        únicas responsables de la asistencia que prestan.
      </p>

      <h2>6. Punto de contacto y denuncia de contenidos</h2>
      <p>
        A efectos del Reglamento (UE) 2022/2065 de Servicios Digitales, el
        punto de contacto único para autoridades y usuarios es{" "}
        <a href="mailto:hola@growwly.es">hola@growwly.es</a>, en
        español. Si crees que un contenido de Growwly (una ficha, una reseña,
        una foto o un texto) es falso o ilegal, puedes denunciarlo desde{" "}
        <a href="/denunciar">este formulario</a>, también enlazado en el pie de
        cada página y en cada ficha de clínica. Confirmamos la recepción, lo
        revisamos y te comunicamos lo que decidamos y por qué.
      </p>

      <h2>7. Legislación aplicable</h2>
      <p>
        Las presentes condiciones se rigen por la legislación española. Para
        cualquier controversia derivada del acceso o uso de este sitio web,
        las partes se someten a los juzgados y tribunales de Palma, salvo
        que la normativa de consumidores establezca otro fuero.
      </p>
    </LegalLayout>
  );
}
