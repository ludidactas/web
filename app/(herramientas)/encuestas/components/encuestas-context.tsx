'use client'

import { CrearEncuesta, Encuesta, RolEncuesta } from '@/polls/encuestas'
import { PollsSession } from '@/polls/session'
import { setupSocketLogging } from '@/polls/test/test-funcs'
import React, { createContext, useContext, useEffect, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import { toast } from 'sonner'

/** Definición del estado y las funciones que representan las encuestas (abstraen el socket) */
const useEncuestaAdminState = () => {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [encuestas, setEncuestas] = useState<Encuesta[]>([])
  const [session, setSession] = useState<PollsSession | null>(null)

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

  // Conexión inicial
  useEffect(() => {
    console.log(`Conectando con servidor de encuestas en ${process.env.NEXT_PUBLIC_ENCUESTA_HOST}...`)

    // Conectamos al namespace de admin con la contraseña
    setSocket(
      io(`${process.env.NEXT_PUBLIC_ENCUESTA_HOST}/polls/admin`, {
        auth: { rol: RolEncuesta.Admin, password: process.env.NEXT_PUBLIC_ENCUESTA_PWD },
      })
    )
  }, [])

  // Conectamos el socket a sus handlers
  useEffect(() => {
    if (socket) {
      setupSocketLogging(socket)

      socket.on('session:opened', ({ sessionId, userId, userIp, username, rol }: PollsSession) => {
        console.log(`Sesión abierta: ${sessionId} para ${username} (${userId}) desde ${userIp} con rol ${rol}`)

        // Guardamos el id de sesión para las siguientes conexiones
        socket.auth = { sessionId }

        // Local state para verla en pantalla
        setSession({ sessionId, userId, userIp, username, rol })
      })
      
      socket.on('polls:list', setEncuestas)
      socket.on('poll:error', showError)
      socket.on('poll:updated', updateEncuesta)
      socket.on('poll:created', addEncuesta)
      socket.on('poll:deleted', deleteEncuesta)
    }
  }, [socket])

  return {
    socket,
    encuestas,
    session,
    enviarPregunta,
    borrarPregunta,
    cerrarPregunta,
    abrirPregunta,
    publicarPregunta,
    esconderPregunta,
  }
}

// Context
const EncuestaAdminContext = createContext<ReturnType<typeof useEncuestaAdminState> | undefined>(undefined)

// Provider
export const EncuestaAdminProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <EncuestaAdminContext.Provider value={useEncuestaAdminState()}>{children}</EncuestaAdminContext.Provider>
}

// Hook para usar el contexto de Encuesta
export const useEncuestaAdmin = () => {
  const context = useContext(EncuestaAdminContext)
  if (!context) {
    throw new Error('Intentando usar useEncuestaAdmin fuera del EncuestaAdminProvider')
  }
  return context
}
