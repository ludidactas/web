'use client'

import { useSession } from 'next-auth/react'
import { useConexionProfe } from '@/wss-cli/providers/wss-profe-context'
import GoJuego from './go-juego'

/** El profe juega Go con la misma mecánica que un estudiante, identificado por su email (mismo
 * userId que usa el resto de su sesión de sala, ver `WssProfeSessionSchema`). */
export default function GoProfe() {
  const { data: session } = useSession()
  return <GoJuego userId={session?.user?.email ?? ''} acciones={useConexionProfe()} />
}
