import { LinkGradiente } from '@/components/custom/ld-link-gradiente'
import { cn } from '@/lib/utils'
import Image from 'next/image'
import { SignIn } from './botones'
import Ilustracion from './ilustracion'
import Link from 'next/link'

export type Intent = '/sala'

export default function Login({ className, intent }: { className?: string; intent?: Intent }) {
  return (
    <div
      className={cn(
        'h-screen self-normal flex drop-shadow-xl flex-col md:flex-row md:gap-16 bg-white md:m-40 p-8 md:p-10 md:rounded-xl items-center justify-center transition-all',
        className
      )}
    >
      <Ilustracion />
      <div className="max-w-lg flex flex-col md:h-fit md:mr-8 items-center">
        {/* Derecha */}
        <div className="animate-aparecer flex flex-col items-center gap-16">
          <div className="flex flex-col gap-4">
            <Link href={'/'}>
              <div className="flex md:w-[30em] items-center gap-4">
                <Image className="w-8 md:w-16" src="/img/logo_sketchy.gif" alt={''} width={100} height={100} />
                <div className="font-medium text-[7px] sm:text-[12px] md:text-[14px] lg:text-[18px] pt-1">
                  <Image
                    className="w-[200px] md:w-[800px]"
                    src="/img/lema_sketchy.gif"
                    alt={''}
                    width={200}
                    height={200}
                  />
                </div>
              </div>
            </Link>

            <p className="text-center font-bold text-xs md:text-xl">¡Conectate con tu cuenta de Google!</p>
          </div>

          {/* Si estaba accediendo a salas */}
          {intent === '/sala' && (
            <div className="flex flex-col gap-4 text-zinc-800 ">
              <p>
                Las salas de profe ofrecen una interfaz en vivo de{' '}
                <span className="text-cyan-600">encuestas y toma de asistencia</span> que podés compartir con tus
                estudiantes. Facilitan la <span className="text-cyan-600">interactividad</span> en{' '}
                <span className="text-emerald-600">experiencias a distancia</span>, independientemente de la plataforma
                que estés usando para transmitir.
              </p>
              <p>
                Construímos esta herramienta a pulmón para que la use la comunidad y así también crezca{' '}
                <LinkGradiente href={'/identidad'}>el proyecto</LinkGradiente>. Nos ayuda que si te sirve la compartas.
              </p>
              <p>
                Conectándote das consentimiento a nuestra{' '}
                <LinkGradiente href="/privacidad">política de privacidad</LinkGradiente>, que te invitamos a leer si es
                la primera vez que te conectás.
              </p>
              <p>¡Adelante!</p>
            </div>
          )}

          {!intent && (
            <div className="flex flex-col gap-4 text-zinc-800 ">
              <p className="text-center p-8 text-xs md:text-xl">
                {' '}
                Conectate y accedé a los recursos que tenemos disponibles para vos.
              </p>
              <p>
                Conectándote das consentimiento a nuestra{' '}
                <LinkGradiente href="/privacidad">política de privacidad</LinkGradiente>, que te invitamos a leer si es
                la primera vez que te conectás.
              </p>
              <p>¡Adelante!</p>
            </div>
          )}

          <div className='w-full flex items-center justify-between'>
            <LinkGradiente href="/" className="p-4">Volver</LinkGradiente>
            <SignIn redirectTo="/sala" />
          </div>
        </div>
      </div>
    </div>
  )
}
