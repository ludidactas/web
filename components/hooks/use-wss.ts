import { Pasaporte } from '@/wss/validators/auth'
import { useEffect } from 'react'
import DebugPanel from './conexion-wss-debug'
import { StatusDeConexion, useConexionWss } from './use-conexion-wss'
import useSesionGuardada from './use-sesion-localstorage'

/** Cose la sesión storeada con el server de WSS */
export function useWss(auth: Pasaporte) {
  const { storedSession, saveSession, clearSession, ready: sessionReady } = useSesionGuardada()
  const { status, iniciarConexion, desconectar, socket, session, error } = useConexionWss()

  // Al desmontar, desconectar
  useEffect(() => { 
    return desconectar
  }, [desconectar])


  // Trigger de conexión
  useEffect(() => {
    console.log(`🔌 useWss: Evaluando conexión...`, status)

    // 1. Esperar dependencias listas
    if (!sessionReady) {
      // Opcional: setear un estado de "CargandoDependencias" si el hook de React lo necesita
      return
    }

    // 2. Condición principal: Conectar SOLO si estamos en estado Quieto, Expirado (lo que forzó a Quieto), o Error
    const hayQueReconectar =
      status === StatusDeConexion.Quieto || status === StatusDeConexion.Expirado || status === StatusDeConexion.Error // Reintento automático tras error

    if (hayQueReconectar) {
      const sessionIdToUse = storedSession?.sessionId
      console.log(`✅ Dependencias listas, estado es ${status}. Iniciando conexión...`)

      // El store maneja internamente la lógica de si hay un socket activo o si debe cerrarlo (Publico -> Estudiante)
      iniciarConexion(auth, sessionIdToUse)
    }
  }, [sessionReady, auth, storedSession, desconectar, status, iniciarConexion, socket])

  // ----------------------------------------------------
  // Lógica de sincronización del estado con sesión local
  // ----------------------------------------------------

  // 1. Cuando el servidor nos da una nueva sesión → persistir
  useEffect(() => {
    if (sessionReady && session) {
      saveSession(session)
    }
  }, [session, saveSession, sessionReady])

  // 2. Cuando el status indica expiración → limpiar localStorage
  useEffect(() => {
    if (sessionReady && status === StatusDeConexion.Expirado) {
      console.log(`Sesión expirada detectada, limpiando localStorage...`)
      clearSession()
      // La limpieza de clearSession() modificará 'storedSession',
      // lo cual re-ejecutará el useEffect de conexión, forzando la reconexión sin sessionId.
    }
  }, [auth, clearSession, sessionReady, status, storedSession])

  return {
    estado: status,
    socket,
    iniciarConexion,
    session,
    error,
    WssDebugPanel: () => DebugPanel({ data: { status, session, error, socket: { id: socket?.id } } }),
  }
}
