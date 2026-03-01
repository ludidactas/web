import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useSession as useSessionNext } from 'next-auth/react'
import { useCallback, useEffect } from 'react'
import { WssServerSession } from '@/wss/validators/session'
import { RolEncuesta } from '@/wss/tipos'
import * as R from 'remeda'

type EstadoSesion = {
  sessions: Record<string, WssServerSession>
  ready: boolean
  setReady: (ready: boolean) => void
  saveSession: (key: string, s: WssServerSession) => void
  clearSession: (key: string) => void
}

export const useSesionStore = create<EstadoSesion>()(
  persist(
    (set) => ({
      sessions: {},
      ready: false,
      setReady: (ready) => set({ ready }),
      saveSession: (key, s) =>
        set((state) => ({
          sessions: R.set(state.sessions, key, s),
        })),

      clearSession: (key) =>
        set((state) => ({
          sessions: R.omit(state.sessions, [key]),
        })),
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
export default function useSesionGuardada(sessionKey: string) {
  const { data: nextSession, status: statusSesionNext } = useSessionNext()

  const storedSession = useSesionStore((state) => state.sessions[sessionKey] || null)
  const saveSessionAction = useSesionStore((state) => state.saveSession)
  const clearSessionAction = useSesionStore((state) => state.clearSession)
  const setReady = useSesionStore((state) => state.setReady)
  const ready = useSesionStore((state) => state.ready)

  useEffect(() => {
    if (statusSesionNext === 'loading') return // todavía no cargó la sesión de next-auth

    const emailSesionNext = nextSession?.user?.email
    const emailSesionWss =
      storedSession?.rol === RolEncuesta.Admin || storedSession?.rol === RolEncuesta.Profe ? storedSession?.email : null

    if (storedSession && emailSesionWss !== emailSesionNext) {
      console.log(
        `🧹 Limpiando sesión guardada por cambio de usuario o inconsistencia: next-auth(${emailSesionNext}) vs wss(${emailSesionWss})`
      )
      clearSessionAction(sessionKey)
      return
    }

    console.log(
      storedSession
        ? `🌀 Sesión ${storedSession.sessionId} cargarda con rol ${storedSession.rol}`
        : `🌀 No hay sesión guardada`
    )
    setReady(true)
  }, [statusSesionNext, storedSession, nextSession, clearSessionAction, setReady, ready])

  return {
    storedSession,
    ready,
    // Prevenimos que react re-defina estas funciones cuando cambie algo que no sea la sessionKey
    saveSession: useCallback(
      (s: WssServerSession) => saveSessionAction(sessionKey, s),
      [saveSessionAction, sessionKey]
    ),
    clearSession: useCallback(() => clearSessionAction(sessionKey), [clearSessionAction, sessionKey]),
  }
}
