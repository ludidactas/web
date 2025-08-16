'use client'
import { RolEncuesta } from '@/polls/encuestas'
import { PollsServerSession } from '@/polls/session'
import { useLocalStorage } from '@uidotdev/usehooks'
import { useSession } from 'next-auth/react'
import { useCallback, useEffect, useState } from 'react'
import { Socket } from 'socket.io-client'
import { toast } from 'sonner'
import { conectarSocket, limpiarListeners, SocketServerAuth, solicitarAuth } from './server-encuestas'
import { ExtendedError } from 'socket.io'

/** Levanta la sesión guardada, valida que coincida con el usuario actual de google, y la reinicia en caso contrario */
function useSesionGuardada() {
  const [ready, setReady] = useState(false)
  const [session, saveSession] = useLocalStorage<PollsServerSession | null>("sesion-guardada", null);

  // Obtiene la sesión de next-auth
  const { data, status } = useSession() 

  useEffect(() => { 
    // Esperamos a que la sesión esté lista
    if(status === "loading") return 

    // Si hay una sesión guardada, pero no coincide con el usuario actual, la limpiamos
    // (en caso de anónimo, ni limpiarla)
    if (session && data?.user?.email && session.username !== data?.user?.email) {
      console.log(`Sesión guardada no coincide con el usuario de google actual. Limpiando sesión guardada.`)
      saveSession(null)
    }

    setReady(true)
  }, [data?.user?.email, saveSession, session, status])

  return {
    session,
    saveSession: saveSession,
    ready
  }
}


// TENGO QUE SEPARAR LAS SESIONES DE LAS SALAS. Que las salas sean long-lived en el server
// y las sesiones sean cortas y se establezcan al conectar el socket, siempre con auth token
// para saber quién la está pidiendo.


export function useServerEncuestas({ idSala, rol }: SocketServerAuth) {

  // Chance deba convertir socket en ref en lugar de state, para tener siempre la instancia fresca.
  const [socket, setSocket] = useState<Socket | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [conectando, setConectando] = useState<boolean>(false)

  // Persistimos la sesión en localStorage
  const { session, saveSession, ready: sessionReady } = useSesionGuardada();

  const efectuarConexion = useCallback(async () => {

    // Listeners de eventos base del socket:

    const onConnect = (sock: Socket) => {
      console.log('Socket conectado:', sock.id)
      setSocket(sock)
      setConectando(false)
    }

    const onError = (sock: Socket, error: ExtendedError & {type?: string}) => {
      console.log('Error de conexión al servidor de encuestas:', error.message, JSON.stringify(error))

      if (error.type && error.type == 'TransportError') { 
        toast.error(`El servidor de encuestas no responde. Reintentando...`)
      }

      if (error.data && error.data.action === 'clear_session') {
        console.log(`Limpiando sesión!`)
        saveSession(null) // Limpiamos la sesión guardada
        sock.auth = {} // Limpiamos la sesión del socket
      }

      setError(`Error de conexión con el servidor de encuestas: ${error.message}`)
      setConectando(false)
    }

    const onDisconect = (sock: Socket, reason: string) => {
      console.log('Socket desconectado:', reason)
      toast.error(`Desconectado del servidor de encuestas: ${reason}`)
      setSocket(null)
    }

    const onSession = (sock: Socket, { sessionId, userIp, username, rol }: PollsServerSession) => {
      console.log(`Sesión abierta: ${sessionId} para ${username} (${rol}) desde IP ${userIp}`)

      // Guardamos la sesión en localStorage para persistencia
      saveSession({ sessionId, userIp, username, rol })

      // Le attacheamos la sesión que nos mandó el server al socket local
      sock.auth = { sessionId }
    }

    const onExpired = (sock: Socket) => {
      console.warn('Sesión expirada, limpiando localStorage...')
      saveSession(null) // Limpiamos la sesión guardada
      sock.auth = {} // Limpiamos la sesión del socket
    }

    const listeners = { onConnect, onError, onDisconect, onSession, onExpired }

    try {
      // Si ya hay una sesión de ws guardada, la reutilizamos
      if (session) {
        
        if (rol === RolEncuesta.Estudiante){
          console.log(`Reutilizando sesión de estudiante ${session.sessionId} para conectar al servidor de encuestas en sala ${idSala}...`)

          // Si es de estudiante, le pasamos el idSala para que se conecte al namespace correcto
          await conectarSocket({ auth: { rol, sessionId: session.sessionId, idSala }, listeners })

        } else { 
          console.log(`Reutilizando sesión de profe/admin ${session.sessionId} para conectar con token al servidor de encuestas...`)

          // Si es de profe o admin, buscamos un token de auth
          const token = await solicitarAuth()
          await conectarSocket({ auth: { rol, sessionId: session.sessionId, token }, listeners })

        }

      } else {

        // Sino pedimos que nos cree una sesión nueva
        if (rol === RolEncuesta.Estudiante) {
          console.log(`Conectando como estudiante anónimo a la sala ${idSala}...`)

          // Sin token pero con idSala el estudiante
          await conectarSocket({ auth: { rol, idSala }, listeners })

        } else {
          console.log(`Conectando como profe o admin al servidor de encuestas...`)

          // Con token de auth de google el profe o admin
          const token = await solicitarAuth()
          await conectarSocket({ auth: { rol, token }, listeners })

        }
      }

      // De-suscribimos los listeners al desmontar el componente
      if(socket)
        return () => limpiarListeners(socket)
    } catch (err) { 

      console.error('Error de autenticación con el servidor de next:', err.message)
      toast.error(`Error de autenticación con el servidor de next: ${err.message}`)
      setError(`Error de autenticación con el servidor de next: ${err.message}`)
      setConectando(false)

    }
  }, [idSala, rol, saveSession, session])

  /**
   * Conexión inicial on mount. Pide auth del server de ws al server de next. 
   */
  useEffect(() => {
    if (!sessionReady) return

    if (!rol || (rol === RolEncuesta.Estudiante && !idSala))
      throw new Error(`Se requiere un idSala y o rol de profe para conectarse al servidor de encuestas`)

    setConectando(true)

    console.log(`Conectando al servidor de encuestas como ${rol}... la sesión es: `, session)

    // Efectuamos la conexión
    efectuarConexion()

    // Cleanup al desmontar
    return () => {
      if (socket) {
        socket.disconnect()
        setSocket(null)
      }
    }
  }, [sessionReady])

  return {
    socket,
    session,
    conectando,
    error,
  }
}