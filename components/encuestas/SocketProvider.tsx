'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import { setupSocketLogging } from './socketLoggingSetup'

// Setup

export interface Encuesta {
  id: number
  pregunta: string
  opciones: { id: number; texto: string; votos: number }[]
  createdAt: string
  isActive: boolean
}

export interface CrearEncuesta extends Omit<Encuesta, 'opciones'> {
  opciones: string[]
  masterPassword: string
}

const useEncuestaState = () => {
  const [socket, setSocket] = useState<Socket>(null)
  const [encuestas, setEncuestas] = useState<Encuesta[]>([])
  const [error, setError] = useState<{ message: string } | null>(null)

  /** Postea al server la acción de crear */
  const enviarPregunta = async (pregunta: string, respuestas: string[]) => {
    setError({ message: '' })

    if (!socket || !socket.connected) {
      setError({ message: 'Socket no conectado' })
      return
    }

    const nuevaEncuesta: CrearEncuesta = {
      masterPassword: process.env.NEXT_PUBLIC_ENCUESTA_PWD,
      id: Date.now(),
      pregunta,
      opciones: respuestas,
      createdAt: new Date().toISOString(),
      isActive: true,
    }

    socket.emit('poll:create', nuevaEncuesta)
  }

  /** Postea al server la acción de borrar */
  const borrarPregunta = (encuestaId: number) => {
    socket.emit('poll:delete', { masterPassword: process.env.NEXT_PUBLIC_ENCUESTA_PWD, pollId: encuestaId })
  }

  /** Postea al server la acción de cerrar */
  const cerrarPregunta = (encuestaId: number) => {
    socket.emit('poll:close', { masterPassword: process.env.NEXT_PUBLIC_ENCUESTA_PWD, pollId: encuestaId })
  }

  /** Updatea el buffer local */
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

  /** Borra una encuesta del buffer local */
  const deleteEncuesta = ({ pollId }: { pollId: number }) => {
    setEncuestas((encs) => encs.filter((e) => e.id != pollId))
  }

  /** Agrega una encuesta al buffer local */
  const addEncuesta = (encuesta: Encuesta) => {
    setEncuestas((encs) => [...encs, encuesta])
  }

  /** Cierra una encuesta en el buffer local */
  const closeEncuesta = (encuesta: Encuesta) => { 
    setEncuestas((encs) => {
      const index = encs.findIndex((e) => e.id === encuesta.id)
      if (index !== -1) {
        const updatedEncuestas = [...encs]
        updatedEncuestas[index].isActive = false
        return updatedEncuestas
      }
      return encs
    })
  }

  // Conexión inicial
  useEffect(() => {
    console.log(`Conectando con servidor de encuestas en ${process.env.NEXT_PUBLIC_ENCUESTA_HOST}...`)
    setSocket(io(process.env.NEXT_PUBLIC_ENCUESTA_HOST))
  }, [])

  // Conectamos el socket a sus handlers
  useEffect(() => {
    if (socket) {
      setupSocketLogging(socket)
      socket.on('polls:list', setEncuestas)
      socket.on('poll:error', setError)
      socket.on('poll:updated', updateEncuesta)
      socket.on('poll:created', addEncuesta)
      socket.on('poll:deleted', deleteEncuesta)
      socket.on('poll:closed', closeEncuesta)
    }
  }, [socket])

  // Reseteamos el error en cada udpate
  useEffect(() => {
    setError({message: ''})
   }, [encuestas])

  return { socket, encuestas, enviarPregunta, borrarPregunta, cerrarPregunta, error }
}

// Context

const EncuestaContext = createContext<ReturnType<typeof useEncuestaState> | undefined>(undefined)

export const EncuestaProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <EncuestaContext.Provider value={useEncuestaState()}>{children}</EncuestaContext.Provider>
}

export const useEncuesta = () => {
  const context = useContext(EncuestaContext)
  if (!context) {
    throw new Error('Intentando usar useEncuesta fuera del EncuestaProvider')
  }
  return context
}
