'use client'

import { Encuesta, RolEncuesta } from '@/polls/encuestas'
import { PollsSession } from '@/polls/session'
import { setupSocketLogging } from '@/polls/test/test-funcs'
import React, { createContext, useContext, useEffect, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import { toast } from 'sonner'

/** Definición del estado y las funciones que representan las encuestas (abstraen el socket) */
const useEncuestaEstudianteState = () => {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [encuestas, setEncuestas] = useState<Encuesta[]>([])
  const [session, setSession] = useState<PollsSession | null>(null)

  const showError = ({ message }: { message: string }) => {
    toast.error(message)
  }

  /** Postea un voto */
  const votar = (encuestaId: string, opcionId: string) => {
    socket!.emit('poll:vote', { pollId: encuestaId, optionId: opcionId })
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

    const sessionStr = localStorage.getItem('polls-session')
    if (sessionStr) { 
      const sessionData: PollsSession = JSON.parse(sessionStr)
      console.log(`Reusando sesión existente: ${sessionData.sessionId} para ${sessionData.username} (${sessionData.userId})`)
      setSession(sessionData)

      // Si ya tenemos una sesión, la usamos para conectarnos
      setSocket(
        io(`${process.env.NEXT_PUBLIC_ENCUESTA_HOST}/polls/estudiante`, { auth: { sessionId: sessionData.sessionId } })
      )
      return
    }

    setSocket(
      io(`${process.env.NEXT_PUBLIC_ENCUESTA_HOST}/polls/estudiante`, { auth: { rol: RolEncuesta.Estudiante } })
    )
  }, [])

  // Conectamos el socket a sus handlers
  useEffect(() => {
    if (socket) {
      setupSocketLogging(socket)

      socket.on('session:opened', ({ sessionId, userId, userIp, username, rol }: PollsSession) => {
        console.log(`Sesión abierta: ${sessionId} para ${username} (${userId}) desde ${userIp} con rol ${rol}`)

        // Guardamos la sesión en localStorage para persistencia
        localStorage.setItem('polls-session', JSON.stringify({ sessionId, userId, userIp, username, rol }))

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
    session,
    encuestas,
    votar,
  }
}

// Context
const EncuestaEstudianteContext = createContext<ReturnType<typeof useEncuestaEstudianteState> | undefined>(undefined)

// Provider
export const EncuestaEstudianteProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <EncuestaEstudianteContext.Provider value={useEncuestaEstudianteState()}>
      {children}
    </EncuestaEstudianteContext.Provider>
  )
}

// Hook para usar el contexto de Encuesta
export const useEncuestaEstudiante = () => {
  const context = useContext(EncuestaEstudianteContext)
  if (!context) {
    throw new Error('Intentando usar useEncuestaEstudiante fuera del EncuestaEstudianteProvider')
  }
  return context
}
