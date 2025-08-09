import { RolEncuesta } from '@/polls/encuestas'
import { PollsServerSession } from '@/polls/session'
import { useLocalStorage } from '@uidotdev/usehooks'
import { useEffect, useState } from 'react'
import { Socket } from 'socket.io-client'
import { toast } from 'sonner'
import { conectarSocket, SocketServerAuth, solicitarAuth } from './server-encuestas'

export function useServerEncuestas({ idSala, rol }: SocketServerAuth) {

  // Chance deba convertir socket en ref en lugar de state, para tener siempre la instancia fresca.
  const [socket, setSocket] = useState<Socket | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [conectando, setConectando] = useState<boolean>(false)

  // Persistimos la sesión en localStorage
  const [session, saveSession] = useLocalStorage<PollsServerSession | null>("sesion-guardada", null);

  const onConnect = (sock: Socket) => {
    console.log('Socket conectado:', sock.id)
    setSocket(sock)
    setConectando(false)
  }

  const onError = (sock: Socket, error: Error) => {
    console.error('Error de conexión al servidor de encuestas:', error.message)
    if (error.message === 'Invalid namespace') toast.error(`La sala no existe`)
    else toast.error(`Error de conexión con el servidor de encuestas: ${error.message}`)
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

  const onTokenError = (error: Error) => {
    console.error('Error de autenticación:', error.message)
    toast.error(`Error de autenticación con el servidor de encuestas: ${error.message}`)
    setError(`Error de autenticación con el servidor de encuestas: ${error.message}`)
    setConectando(false)
  }

  const efectuarConexion = async () => {
    // Si ya hay una sesión de ws guardada, la reutilizamos
    if (session) {
      console.log(`Reutilizando sesión ${session.sessionId} para conectar al servidor de encuestas...`)
      conectarSocket({ auth: { rol, sessionId: session.sessionId, idSala }, onConnect, onError, onDisconect, onSession })
    } else {
      // Sino creamos una iniciando la conexión con un token de autenticación de nuestra api de next
      if (rol === RolEncuesta.Estudiante) {
        conectarSocket({ auth: { rol, idSala }, onConnect, onError, onDisconect, onSession })
      } else {
        solicitarAuth().then((token) => {
          conectarSocket({ auth: { rol, token }, onConnect, onError, onDisconect, onSession })
        }).catch(onTokenError)
      }
    }
  }

  /**
   * Conexión inicial on mount. Pide auth del server de ws al server de next. 
   */
  useEffect(() => {

    if (!rol || (rol === RolEncuesta.Estudiante && !idSala))
      throw new Error(`Se requiere un idSala y o rol de profe para conectarse al servidor de encuestas`)

    setConectando(true)

    console.log(`Conectando al servidor de encuestas como ${rol}...`, session)

    // Efectuamos la conexión
    efectuarConexion()

    // Cleanup al desmontar
    return () => {
      if (socket) {
        socket.disconnect()
        setSocket(null)
      }
    }
  }, [])

  return {
    socket,
    session,
    conectando,
    error,
  }
}