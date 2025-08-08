'use client'

import { auth } from '@/app/auth'
import { CrearEncuesta, Encuesta } from '@/polls/encuestas'
import { PollsSession } from '@/polls/session'
import { setupSocketLogging } from '@/polls/test/test-funcs'
import React, { createContext, useContext, useEffect, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import { toast } from 'sonner'

/** Definición del estado y las funciones que representan las encuestas (abstraen el socket) */
const useEncuestaProfeState = (email: string) => {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [encuestas, setEncuestas] = useState<Encuesta[]>([])
  const [session, setSession] = useState<PollsSession | null>(null)
  const [linkSala, setLinkSala] = useState<string | null>(null)

  const showError = ({ message }: { message: string }) => {
    toast.error(message)
  }

  const conPassword = (payload: any) => ({ ...payload, password: process.env.NEXT_PUBLIC_ENCUESTA_PWD })

  /** Postea al server la acción de crear */
  const enviarPregunta = async (pregunta: string, respuestas: string[]) => {
    const nuevaEncuesta: CrearEncuesta = {
      password: process.env.NEXT_PUBLIC_ENCUESTA_PWD!,
      pregunta,
      opciones: respuestas,
    }

    socket!.emit('poll:create', nuevaEncuesta)
  }

  /** Postea al server la acción de borrar */
  const borrarPregunta = (encuestaId: string) => {
    socket!.emit('poll:delete', conPassword({ pollId: encuestaId }))
  }

  /** Postea al server la acción de cerrar */
  const cerrarPregunta = (encuestaId: string) => {
    socket!.emit('poll:close', conPassword({ pollId: encuestaId }))
  }

  /** Postea al server la acción de abrir */
  const abrirPregunta = (encuestaId: string) => {
    socket!.emit('poll:open', conPassword({ pollId: encuestaId }))
  }

  /** Postea al sever la acción de publicar */
  const publicarPregunta = (encuestaId: string) => {
    socket!.emit('poll:publish', conPassword({ pollId: encuestaId }))
  }

  /** Postea al sever la acción de publicar */
  const esconderPregunta = (encuestaId: string) => {
    socket!.emit('poll:hide', conPassword({ pollId: encuestaId }))
  }

  const recibirIdEncuesta = ({ salaId }: {salaId: string}) => {
    toast.info(`Recibido id de encuesta: ${salaId}`)
    setLinkSala(`https://ludidactas.com/sala/${salaId}/`)
  }

  // Handlers

  /** Agrega una encuesta al buffer local */
  const addEncuesta = (encuesta: Encuesta) => {
    setEncuestas((encs) => [...encs, encuesta])
  }

  /** Borra una encuesta del buffer local */
  const deleteEncuesta = ({ pollId }: { pollId: string }) => {
    setEncuestas((encs) => encs.filter((e) => e.id != pollId))
  }

  /** Updatea el buffer local, pisando la encuesta existente */
  const updateEncuesta = (encuesta: Encuesta) => {
    setEncuestas((prev) => {
      const index = prev.findIndex((e) => e.id === encuesta.id)
      if (index !== -1) {
        const newEncuestas = [...prev]
        newEncuestas[index] = encuesta
        return newEncuestas
      }
      return prev
    })
  }

  /** Inicializa el socket y se conecta al servidor de encuestas */
  function conectarConServer() {
    console.log(`Obteniendo token del server...`)
    fetch('/api/auth/token')
      .then((res) => res.json())
      .then(({ token }) => {
        console.log(
          `Conectando con servidor de encuestas en ${process.env.NEXT_PUBLIC_ENCUESTA_HOST} con token ${JSON.stringify(
            token
          )}...`
        )

        if (!token)
          throw new Error(
            `Se require una sesión activa y un token de sesión de Google para conectarse al servidor de encuestas`
          )

        // Conectamos al namespace de profe con el token de sesión de Google
        try {
          const sock = io(`${process.env.NEXT_PUBLIC_ENCUESTA_HOST}/polls/${email}/profe`, { auth: { token } })

          sock.on('connect_error', (error) => {
            console.error('Socket connection error:', error)
            toast.error(`Error de conexión: ${error.message}`)
          })

          setSocket(sock)
        } catch (err) {
          console.error('Error al conectar con el servidor de encuestas:', err)
          return
        }
      })
      .catch((err) => {
        console.error('Error al obtener el token del servidor:', err)
        toast.error('Error al conectar con el servidor de encuestas. Por favor, inténtalo de nuevo más tarde.')
      })
  }

  // Conexión inicial
  useEffect(() => {
    conectarConServer()
  }, [])

  // Conectamos el socket a sus handlers
  useEffect(() => {
    if (socket) {
      setupSocketLogging(socket)

      socket.on('session:opened', ({ sessionId, userIp, username, rol }: PollsSession) => {
        console.log(`Sesión abierta: ${sessionId} para ${username} (}) desde ${userIp} con rol ${rol}`)

        // Guardamos el id de sesión para las siguientes conexiones
        socket.auth = { sessionId }

        // Local state para verla en pantalla
        setSession({ sessionId, userIp, username, rol })
      })

      socket.on('polls:list', setEncuestas)
      socket.on('poll:error', showError)
      socket.on('poll:updated', updateEncuesta)
      socket.on('poll:created', addEncuesta)
      socket.on('poll:deleted', deleteEncuesta)
      socket.on('sala:creada', recibirIdEncuesta)
    }
  }, [socket])

  return {
    socket,
    encuestas,
    session,
    linkEncuesta: linkSala,
    enviarPregunta,
    borrarPregunta,
    cerrarPregunta,
    abrirPregunta,
    publicarPregunta,
    esconderPregunta,
  }
}

// Context
const EncuestaAdminContext = createContext<ReturnType<typeof useEncuestaProfeState> | undefined>(undefined)

// Provider
export const EncuestaAdminProvider: React.FC<{ email: string; children: React.ReactNode }> = ({ email, children }) => {
  return <EncuestaAdminContext.Provider value={useEncuestaProfeState(email)}>{children}</EncuestaAdminContext.Provider>
}

// Hook para usar el contexto de Encuesta
export const useEncuestaAdmin = () => {
  const context = useContext(EncuestaAdminContext)
  if (!context) {
    throw new Error('Intentando usar useEncuestaAdmin fuera del EncuestaAdminProvider')
  }
  return context
}
