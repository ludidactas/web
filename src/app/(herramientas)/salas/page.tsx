import { auth } from '@/app/auth'
import { tokenWss } from '@/server/token_wss'
import { ConexionProfeProvider } from '@/wss-cli/providers/wss-profe-context'
import HeaderSala from '@/components/salas/header-sala'
import { Toaster } from '@/components/ui/sonner'
import { nombreSplit } from '@/lib/utils'
import { SignOut } from '@/app/(herramientas)/login/components/botones'
import SalasPageClient from './salas-page-client'

// Gestión de salas (token-only): el ABM se hace por eventos del WSS, no por server actions.
export default async function SalasPage() {
  const session = await auth()
  const token = await tokenWss()

  return (
    <ConexionProfeProvider auth={{ token }}>
      <Toaster />
      <div className="h-screen flex flex-col overflow-hidden bg-gradient-to-r from-cyan-500/70 to-indigo-500/70">
        <HeaderSala btnLogout={<SignOut />} waveHeight="h-[20px] md:h-[50px]">
          <p className="text-md md:text-4xl text-center">¡Hola {nombreSplit(session?.user?.name)}!</p>
        </HeaderSala>
        <SalasPageClient />
      </div>
    </ConexionProfeProvider>
  )
}
