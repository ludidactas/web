import { auth } from '@/app/auth'
import { tokenWss } from '@/server/token_wss'
import { getIdsSalasDeProfe } from '@/wss/salas/db'
import { ConexionProfeProvider } from '@/wss-cli/providers/wss-profe-context'
import HeaderSala from '@/components/salas/header-sala'
import { Toaster } from '@/components/ui/sonner'
import { nombreSplit } from '@/lib/utils'
import { SignOut } from '@/app/(herramientas)/login/components/botones'
import SalasPageClient from './salas-page-client'

export default async function SalasPage() {
  const session = await auth()
  const token = await tokenWss()

  // Si el profe ya tiene una sala creada, conectamos el socket de una para mostrársela.
  // Si no tiene ninguna, NO conectamos: el socket recién se crea cuando aprieta "Crear" en "Crear sala".
  const idSalaExistente = session?.user?.email ? (await getIdsSalasDeProfe(session.user.email))[0] ?? null : null

  return (
    <ConexionProfeProvider auth={{ token }} abrirSalaId={idSalaExistente ?? undefined}>
      <Toaster />
      <div className="h-screen flex flex-col overflow-y-auto sm:overflow-hidden bg-gradient-to-r from-cyan-500/70 to-indigo-500/70">
        <HeaderSala btnLogout={<SignOut />} waveHeight="h-[20px] md:h-[50px]">
          <p className="text-md md:text-4xl text-center">¡Hola {nombreSplit(session?.user?.name)}!</p>
        </HeaderSala>
        <SalasPageClient idSalaInicial={idSalaExistente} />
      </div>
    </ConexionProfeProvider>
  )
}
