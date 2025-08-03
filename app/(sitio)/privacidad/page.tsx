import Link from 'next/link'

export default function Privacidad() {
  return (
    <div className="max-w-[640px] flex flex-col gap-4 mt-12 mb-24">
      <h1 className="text-4xl">Política de Privacidad</h1>
      <p>¿Quiénes son ustedes? ¿Por qué tengo que registrarme? ¿Qué información solicitan y para qué la van a usar? </p>
      <p>
        <b>Ludidactas</b> es un laboratorio didáctico contemporáneo donde, entre otras actividades, diseñamos e
        implementamos herramientas web para docentes, talleristas y educadores de todo tipo y contexto. Hacemos todo muy
        a pulmón y somos personas normales en casas normales en barrios normales, apasionadxs de la educación y con
        alguna destreza para la programación, el desarrollo web y el diseño.
      </p>

      <h2 className="text-xl">Qué datos recolectamos (y por qué)</h2>
      <h3>Para crear tu cuenta:</h3>
      <p>Nombre y email (vía Google OAuth)</p>
      <p>Ubicación aproximada (opcional)</p>
      <h3>Durante el uso:</h3>
      <p>Los contenidos que crees y sus respuestas (anonimizado)</p>
      <p>Datos básicos de uso (cantidad de accesos, horarios, etc, para mejorar el servicio)</p>

      <h2 className="text-xl">Por qué necesitamos estos datos</h2>
      <p>
        <b>Protección del servicio:</b> El registro nos ayuda a prevenir bots y uso abusivo de nuestros recursos
        limitados.
      </p>
      <p>
        <b>Conocer a nuestra comunidad:</b> Saber dónde están nuestros usuarios y entender las materias y contenidos que
        les resultan relevantes nos orienta sobre dónde dar seminarios o qué herramientas desarrollar después.
      </p>
      <p>
        <b>Comunicación:</b> Si nos lo permitís, te enviamos novedades ocasionales sobre nuevas herramientas.
      </p>

      <h2 className="text-xl">Qué hacemos con tu información</h2>

      <h3>
        Lo que <b>sí</b> hacemos:
      </h3>

      <p>- Guardamos tus datos de forma segura</p>
      <p>- Los usamos para mejorar nuestras herramientas</p>
      <p>- Analizamos patrones de uso (de forma anónima)</p>

      <h3>
        Lo que <b>nunca</b> vamos a hacer:
      </h3>

      <p>- Vender tu información</p>
      <p>- Compartirla con terceros</p>
      <p>- Usar tu email para spam</p>
      <p>- Sacar provecho personal de tus datos</p>

      <h3>Tus derechos</h3>

      <p>
        <b>- Acceso:</b> Podés pedirnos una copia de tus datos
      </p>
      <p>
        <b>- Corrección:</b> Si algo está mal, avisanos para corregirlo
      </p>
      <p>
        <b>- Eliminación:</b> Podés solicitar borrar tu cuenta y todos tus datos
      </p>
      <p>
        <b>- Portabilidad:</b> Podés pedirrnos tus datos en formato exportable
      </p>

      <p>
        La política de utilización del servicio de autenticación a la que adhiere Ludidactas
        para que puedas conectarte con tu cuenta de Google puede leerse{' '}
        <Link className="underline" href="https://developers.google.com/terms/api-services-user-data-policy">
          acá
        </Link>.
      </p>
    </div>
  )
}
