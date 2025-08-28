'use client'

import { RolEncuesta } from '@/wss/encuestas'
import React, { createContext, useContext, useEffect } from 'react'
import { toast } from 'sonner'
import { useEncuestaStore } from '../../encuestas/components/encuestas-store'
import { useServerWebsockets } from '../../encuestas/components/use-server-encuestas'

/** Cose el socket con el state para estudiante */
const useEncuestaEstudianteState = (idSala: string, nombre?: string) => {

  const { encuestas, addEncuesta, setEncuestas, updateEncuesta, deleteEncuesta } = useEncuestaStore()
  const { socket, session, conectado, error } = useServerWebsockets({ nombre, idSala, rol: RolEncuesta.Estudiante })

  const showError = ({ message }: { message: string }) => {
    toast.error(message)
  }

  /** Postea un voto */
  const votar = (encuestaId: string, opcionId: string) => {
    socket!.emit('poll:vote', { pollId: encuestaId, optionId: opcionId })
  }

  // Cuando el socket conecta...
  useEffect(() => {
    if (socket) {
      // Pedimos la lista exitente de encuestas al conectarse
      socket.emit('polls:list')

      // Conectamos el socket a sus handlers
      socket.on('polls:list', setEncuestas)
      socket.on('poll:error', showError)
      socket.on('poll:updated', updateEncuesta)
      socket.on('poll:created', addEncuesta)
      socket.on('poll:deleted', ({ pollId }) => deleteEncuesta(pollId))
      
      return () => {
        socket.removeAllListeners('polls:list')
        socket.removeAllListeners('poll:error')
        socket.removeAllListeners('poll:updated')
        socket.removeAllListeners('poll:created')
        socket.removeAllListeners('poll:deleted')
      }
    }
  }, [socket])

  return {
    session,
    conectado,
    error,
    encuestas,
    votar,
  }
}

// Context
const EncuestaEstudianteContext = createContext<ReturnType<typeof useEncuestaEstudianteState> | undefined>(undefined)

// Provider
export const EncuestaEstudianteProvider: React.FC<{ idSala: string; children: React.ReactNode }> = ({
  idSala,
  children,
}) => {
  return (
    <EncuestaEstudianteContext.Provider value={useEncuestaEstudianteState(idSala)}>
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
