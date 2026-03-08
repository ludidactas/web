import { auth } from '@/app/auth'
import EncuestasProfe from '@/components/salas/encuestas-profe'
import HeaderSala from '@/components/salas/header-sala'
import { Toaster } from '@/components/ui/sonner'
import { nombreSplit } from '@/lib/utils'
import { tokenWss } from '@/server/token_wss'
import { redirect } from 'next/navigation'
import { SignOut } from '../login/components/botones'
import { ConexionProfeProvider } from '@/wss-cli/providers/wss-profe-context'

export default async function SalaPage() {
  const session = await auth()

  // Esto no habría que hacerlo, hay que resolverlo con next-auth
  if (!session || !session.user) redirect('/login?callbackUrl=/sala')

  const token = await tokenWss()

  return (
    <ConexionProfeProvider auth={{ token }}>
      <Toaster />
      <div className="min-h-screen w-screen mx-auto flex flex-col items-center bg-gradient-to-r from-cyan-500/70 to-indigo-500/70 ">
        <HeaderSala className="animate-aparecer" btnLogout={<SignOut />}>
          <p className="text-md md:text-4xl text-center rounded-xl">¡Hola {nombreSplit(session?.user.name)}!</p>
        </HeaderSala>
        <div className="w-screen h-screen md:px-4">
          <EncuestasProfe />
        </div>

        <div className="w-full" />
      </div>
    </ConexionProfeProvider>
  )
}
