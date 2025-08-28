import { PollsServerSession } from "@/wss/session"
import { useSession } from "next-auth/react"
import { useState, useEffect } from "react"
import { useLocalStorage } from "usehooks-ts"

/** 
 * Levanta la sesión guardada en localStorage, valida que coincida con el usuario actual de google, y la reinicia en caso contrario. 
 * Depende de useSession de next-auth para saber el usuario actual.
 */
export default function useSesionGuardada() {
  const [ready, setReady] = useState(false)

  // Obtiene la sesión del server de websockets almacenada en localStorage
  const [storedSession, saveSession, clearSession] = useLocalStorage<PollsServerSession | null>('sesion-guardada', null)

  // Obtiene la sesión de next-auth
  const { data: nextSession, status } = useSession()

  useEffect(() => {
    // Esperamos a que la sesión esté lista
    if (status === "loading") return

    // Si hay una sesión guardada, pero no coincide con el usuario actual, la limpiamos
    // (en caso de anónimo, ni limpiarla)
    if (storedSession && nextSession?.user?.email && storedSession.email !== nextSession?.user?.email) {
      clearSession()
      return
    }

    setReady(true)
  }, [nextSession?.user?.email, clearSession, storedSession, status])

  return {
    session: storedSession,
    saveSession: saveSession,
    clearSession,
    ready
  }
}