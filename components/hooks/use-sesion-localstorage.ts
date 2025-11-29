import { create } from "zustand"
import { persist } from "zustand/middleware"
import { WssServerSession } from "@/wss/middleware/session"
import { useSession } from "next-auth/react"
import { useEffect } from "react"

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
      name: "sesion-guardada", // clave en localStorage
    }
  )
)

/** 
 * Levanta la sesión guardada en localStorage, valida que coincida con el usuario actual de google, y la reinicia en caso contrario. 
 * Depende de useSession de next-auth para saber el usuario actual. Es por eso que es async, con un flag ready.
 */
export default function useSesionGuardada() {
  const { data: nextSession, status } = useSession()
  const { storedSession, clearSession, setReady, ready } = useSesionStore()

  useEffect(() => {
    if (
      storedSession &&
      nextSession?.user?.email &&
      storedSession.email !== nextSession.user.email
    ) {
      clearSession()
      return
    }

    setReady(true)
  }, [status, storedSession, nextSession, clearSession, setReady, ready])

  return useSesionStore()
}

