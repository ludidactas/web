import { PollsServerSession } from "@/polls/session"
import { useSession } from "next-auth/react"
import { useState, useEffect } from "react"
import { useLocalStorage } from "usehooks-ts"

/** Levanta la sesión guardada en localStorage, valida que coincida con el usuario actual de google, y la reinicia en caso contrario */
export default function useSesionGuardada() {
  const [ready, setReady] = useState(false)

  // Obtiene la sesión del server de websockets almacenada en localStorage
  const [session, saveSession, clearSession] = useLocalStorage<PollsServerSession | null>('sesion-guardada', null)

  // Obtiene la sesión de next-auth
  const { data, status } = useSession()

  useEffect(() => {
    // Esperamos a que la sesión esté lista
    if (status === "loading") return

    // Si hay una sesión guardada, pero no coincide con el usuario actual, la limpiamos
    // (en caso de anónimo, ni limpiarla)
    if (session && data?.user?.email && session.username !== data?.user?.email) {
      console.log(`Sesión guardada no coincide con el usuario de google actual. Limpiando sesión guardada.`)
      clearSession()
    }

    setReady(true)
  }, [data?.user?.email, clearSession, session, status])

  return {
    session,
    saveSession: saveSession,
    clearSession,
    ready
  }
}