import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useSession as useSessionNext } from 'next-auth/react'
import { useEffect } from 'react'
import { WssServerSession } from '@/wss/validators/session'
import { RolEncuesta } from '@/wss/tipos'

type EstadoSesion = {
  storedSession: WssServerSession | null
  ready: boolean
  setReady: (ready: boolean) => void
  saveSession: (s: WssServerSession) => void
  clearSession: () => void
}

export const useSesionStore = create<EstadoSesion>()(
  persist(
    (set) => ({
      storedSession: null,
      ready: false,
      setReady: (ready) => set({ ready }),
      saveSession: (s) => set({ storedSession: s }),
      clearSession: () => set({ storedSession: null }),
    }),
    {
      name: 'sesion-guardada', // clave en localStorage
    }
  )
)

/**
 * Levanta la sesión guardada en localStorage, valida que coincida con el usuario actual de google, y la invalida en caso contrario.
 * Depende de useSession de next-auth para saber el usuario actual. Es por eso que es async, con un flag ready.
 */
export default function useSesionGuardada() {
  const { data: nextSession, status: statusSesionNext } = useSessionNext()
  const { storedSession, clearSession, setReady, ready } = useSesionStore()

  useEffect(() => {
    if (statusSesionNext === 'loading') return // todavía no cargó la sesión de next-auth

    const emailSesionNext = nextSession?.user?.email
    const emailSesionWss =
      storedSession?.rol === RolEncuesta.Admin || storedSession?.rol === RolEncuesta.Profe ? storedSession?.email : null

    if (storedSession && emailSesionWss !== emailSesionNext) {
      console.log(
        `🧹 Limpiando sesión guardada por cambio de usuario o inconsistencia: next-auth(${emailSesionNext}) vs wss(${emailSesionWss})`
      )
      clearSession()
      return
    }

    console.log(
      storedSession
        ? `🌀 Sesión ${storedSession.sessionId} cargarda con rol ${storedSession.rol}`
        : `🌀 No hay sesión guardada`
    )
    setReady(true)
  }, [statusSesionNext, storedSession, nextSession, clearSession, setReady, ready])

  return useSesionStore()
}
