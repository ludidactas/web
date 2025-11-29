import { WssServerSession } from '@/wss/middleware/session'
import { Pasaporte } from '@/wss/validators/auth'
import { useCallback, useEffect, useRef } from 'react'
import { isNonNullish } from 'remeda'
import { Socket } from 'socket.io-client'
import { create } from 'zustand'
import DebugPanel from './conexion-wss-debug'
import { configurarListeners, handshake, limpiarListeners } from './server-encuestas'
import useSesionGuardada from './use-sesion-localstorage'

// Máquina de estados finitos

export enum StatusDeConexion {
  Quieto = 'idle',
  Autenticando = 'authenticating',
  Conectando = 'connecting',
  Conectado = 'connected',
  Error = 'error',
  Expirado = 'expired',
}

type Estado = {
  socket: Socket | null
  status: StatusDeConexion
  error: string | null
  session: WssServerSession | null

  conectar: (auth: Pasaporte, sessionId?: string) => Promise<void>
  desconectar: () => void
}

export const useConexionStore = create<Estado>((set, get) => ({
  socket: null,
  status: StatusDeConexion.Quieto,
  error: null,
  session: null,

  async conectar(auth, sessionId) {
    if (get().socket) console.warn('Ya hay un socket!', get().socket!.id)

    set({ status: StatusDeConexion.Conectando, error: null })

    const sock = await handshake({ ...auth, sessionId })

    // En el listener de onConnect seteamos el socket en el store
    const listeners = {
      onConnect(s: Socket) {
        console.log('Conectado al servidor de encuestas, socket id:', s.id)
        set({ socket: s, status: StatusDeConexion.Conectado })
      },
      onDisconect(_s: Socket, reason: string) {
        console.warn('Desconectado:', reason)
        set({ status: StatusDeConexion.Quieto, socket: null })
      },
      onSession(s: Socket, sesion: WssServerSession) {
        set({ session: sesion })
        s.auth = { ...s.auth, sessionId: sesion.sessionId }
      },
      onExpired(s: Socket) {
        set({ status: StatusDeConexion.Expirado, session: null })
        s.auth = {}
        // Limpiar la sesión storeada
        // auto-reconnect
        setTimeout(() => get().conectar(auth), 1000)
      },
      onError(s: Socket, err: any) {
        let msg = err.message
          ? `Error de conexión con el servidor de encuestas: ${err.message}`
          : 'Error desconocido'

        // Server down
        if (err.message === 'xhr poll error' || (err.type && err.type === 'TransportError')) {
          msg = 'El servidor de encuestas no responde. Intentando reconectar...'
          set({ status: StatusDeConexion.Error, error: msg })
        }

        // Sesión expirada
        else if (err.data && err.data.action === 'clear_session') {
          msg = 'Sesión expirada. Reestableciendo...'
          set({ status: StatusDeConexion.Expirado, error: msg })
          listeners.onExpired(s)
        }

        // Sala inexistente
        else if (err.message === 'Invalid namespace') {
          // Este error lo tira el server cuando el _canal_ no existe, pero estamos diciendo que es que la sala no existe
          // Revisar
          msg = `Esta sala no existe! Por favor, verificá el ID`
          set({ status: StatusDeConexion.Error, error: msg })
          // console.error(err)
        }

        else { 
          set({ status: StatusDeConexion.Error, error: err.message })
        }

        console.log('💥 [WSS] ', err.name, err.message, msg)
      },
    }

    await configurarListeners({ sock, listeners })

    sock.connect()
  },

  desconectar() {
    const sock = get().socket
    if (isNonNullish(sock)) {
      limpiarListeners(sock)
      sock.disconnect()
    }
    set({ socket: null, status: StatusDeConexion.Quieto })

    // Invalidar sesión?

  },
}))

/** Cose la sesión storeada con el server de WSS */
export function useConexionWss(auth: Pasaporte) {
  const { storedSession, saveSession, clearSession, ready: sessionReady } = useSesionGuardada()
  const { status, conectar, desconectar, socket, session, error } = useConexionStore()

  const haySocket = useRef(false)

  const WssDebugPanel = useCallback(() => DebugPanel({ data: { status, session, error } }), [status, session, error])

  // cuando el servidor nos da una nueva sesión → persistir
  useEffect(() => {
    if (!sessionReady) return

    if (session) {
      console.log(`Sesión actualizada, persistiendo...`)
      saveSession(session)
    }
  }, [session, saveSession, sessionReady])

  // cuando la sesión expira, limpiamos localStorage
  useEffect(() => {
    if (!sessionReady) return

    if (status === StatusDeConexion.Expirado) {
      console.log(`Sesión expirada, limpiando...`)
      clearSession()
    }
  }, [status, clearSession, sessionReady])

  // Cuando tengamos sesión, si el status es quieto y no hay socket (es decir, si estamos arrancando), triggereamos
  useEffect(() => {
    if (!sessionReady) return

    if (status === StatusDeConexion.Quieto && !haySocket.current) {
      console.log(`Sesión lista, conectando...`, status, socket)
      haySocket.current = true
      conectar(auth, storedSession?.sessionId)
    } 

    return () => {
      if (isNonNullish(socket) && haySocket.current) {
        haySocket.current = false
        console.log(`Limpiando socket...`, socket.id)
        desconectar()
      }
    }
  }, [sessionReady, status, haySocket, storedSession])

  return { estado: status, socket, conectar, session, error, WssDebugPanel }
}
