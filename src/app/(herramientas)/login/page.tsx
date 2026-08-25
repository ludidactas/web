import { auth } from '@/app/auth'
import { SignOut } from './components/botones'
import Link from 'next/link'
import GoogleLogin, { Intent } from './components/login'
import Image from 'next/image'
import logoSketchy from '@/img/logo_sketchy.gif'
import lemaSketchy from '@/img/lema_sketchy.gif'

type Props = {
  searchParams: Promise<{
    callbackUrl?: string
  }>
}

/** El middleware manda `callbackUrl` como URL absoluta (`http://host/salas`); el logout lo manda relativo (`/salas`). Contemplamos ambos formatos. */
function intentDesdeCallbackUrl(callbackUrl?: string): Intent | undefined {
  if (!callbackUrl) return undefined
  const pathname = callbackUrl.startsWith('/') ? callbackUrl : new URL(callbackUrl).pathname
  return pathname === '/salas' || pathname.startsWith('/salas/') ? '/salas' : undefined
}

export default async function ProfeLoginPage({ searchParams }: Props) {
  const session = await auth()

  const { callbackUrl } = await searchParams
  const intent = intentDesdeCallbackUrl(callbackUrl)

  if (!session?.user)
    return (
      <div className="flex flex-col items-center bg-ld-gradiente-fondo justify-center h-[100vh] w-[100vw]">
        <GoogleLogin className="animate-aparecer" intent={intent} />
      </div>
    )

  return (
    // Ya estás conectadx
    <div className="flex flex-col gap-2 items-center bg-cyan-50 justify-center h-screen">
      <div className=" flex flex-col bg-white p-10 rounded-xl items-center justify-center ">
        <div className="flex md:w-[20em] items-center mb-4 gap-4">
          <Image className="w-8 md:w-10 h-auto" src={logoSketchy} alt="" />
          <div className="font-medium text-[7px] sm:text-[12px] md:text-[14px] lg:text-[18px] pt-1">
            <Image className="w-[200px] md:w-[800px] h-auto" src={lemaSketchy} alt="Ludidactas" />
          </div>
        </div>
        <p>Ya estás conectadx con </p>
        <span className="text-cyan-600">{session.user.email}</span>
        <Link href="/salas">
          <div className="flex flex-col items-center my-4 justify-center p-8 gap-4 hover:bg-cyan-600/10 border-2 rounded-xl hover:cursor-pointer">
            <p className="font-bold">{session.user.name}</p>
            {session.user.image && <img className="rounded-full w-20" src={session.user.image} alt="User Avatar" />}
            <p className="hover:underline">Ir a tu sesión</p>
          </div>
        </Link>
        <SignOut />
      </div>
    </div>
  )
}
