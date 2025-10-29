import { PollsServerSession } from '@/wss/session'
import { RolEncuesta } from '@/wss/tipos'
import { useEffect, useRef } from 'react'
import { isNonNullish } from 'remeda'
import { Socket } from 'socket.io-client'
import { create } from 'zustand'
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
  session: PollsServerSession | null

  conectar: (auth: Pasaporte, sessionId?: string) => Promise<void>
  desconectar: () => void
}

export interface PasaporteEstudiante {
  rol: RolEncuesta.Estudiante
  idSala: string
  nombre?: string
  icono?: string
  dni?: string
}

export interface PasaporteProfe {
  rol: RolEncuesta.Profe
  token: string
}

export interface PasaporteTester {
  rol: RolEncuesta.Tester
  url: string
  nombre?: string
}

export interface PasaportePublico { 
  rol: RolEncuesta.Publico
  idSala: string
}

/**
 * Credenciales para establecer una sesión con el server
 */
export type Pasaporte = PasaporteEstudiante | PasaporteProfe | PasaporteTester | PasaportePublico

export const useConexionStore = create<Estado>((set, get) => ({
  socket: null,
  status: StatusDeConexion.Quieto,
  error: null,
  session: null,

  async conectar(auth, sessionId) {
    set({ status: StatusDeConexion.Conectando, error: null })

    console.log(`Estableciendo handshake...`)
    const sock = await handshake({ ...auth, sessionId })
    console.log(`Handshake establecido!`)

    const listeners = {
      onConnect(s: Socket) {
        set({ socket: s, status: StatusDeConexion.Conectado })
      },
      onDisconect(_s: Socket, reason: string) {
        console.warn('Desconectado:', reason)
        set({ status: StatusDeConexion.Quieto, socket: null })
      },
      onSession(s: Socket, sesion: PollsServerSession) {
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
        }

        else { 
          set({ status: StatusDeConexion.Error, error: err.message })
        }

        console.log('💥 [WSS] ', err.name, err.message, msg)
      },
    }

    await configurarListeners({ sock, listeners })

    console.log(`Conectando socket...`)
    sock.connect()
  },

  desconectar() {
    const sock = get().socket
    if (isNonNullish(sock)) {
      limpiarListeners(sock)
      sock.disconnect()
    }
    set({ socket: null, status: StatusDeConexion.Quieto })
  },
}))

/** Cose la sesión storeada con el server de WSS */
export function useConexionWss(auth: Pasaporte) {
  const { storedSession, saveSession, clearSession, ready: sessionReady } = useSesionGuardada()
  const { status, conectar, socket, session, error } = useConexionStore()
  const haySocket = useRef(false)

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

  useEffect(() => {
    console.log(`@useEffect`, status, haySocket.current, auth, storedSession)
    if (!sessionReady) return
    console.log(`sessionReady!`, status, haySocket.current, auth, storedSession)
    if (status === StatusDeConexion.Quieto && !haySocket.current) {
      console.log(`Sesión lista, conectando...`, status, socket)
      haySocket.current = true
      conectar(auth, storedSession?.sessionId)
    }
    return () => {
      if (isNonNullish(socket)) {
        socket.disconnect()
      }
    }
  }, [sessionReady, status, haySocket, storedSession])

  return { estado: status, socket, conectar, session, error }
}
