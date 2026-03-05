'use client'

import { StatusDeConexion } from '@/components/hooks/use-conexion-wss'
import { useWss } from '@/components/hooks/use-wss'
import { RolEncuesta } from '@/wss/tipos'
import React, { createContext, useContext, useEffect } from 'react'
import { toast } from 'sonner'
import { useEncuestaStore } from '../encuestas-store'
import { useEncuestaEstudianteLogin } from './encuestas-estudiante-login-context'
import { PasaporteEstudiante } from '@/wss/validators/auth'

/** Cose el socket con el state para estudiante */
const useEncuestaEstudianteState = (auth: Omit<PasaporteEstudiante, 'rol'>) => {
  const { encuestas, addEncuesta, setEncuestas, updateEncuesta, deleteEncuesta } = useEncuestaStore()
  const { setIngresado } = useEncuestaEstudianteLogin()
  const { socket, session, estado, error, WssDebugPanel } = useWss({
    ...auth,
    rol: RolEncuesta.Estudiante,
  })

  // Si la conexión expira, sacamos al usuario de la sala
  useEffect(() => {
    if (estado === StatusDeConexion.Expirado) {
      setIngresado(false)
    }
  }, [estado])

  const showError = ({ message }: { message: string }) => {
    toast.error(message)
  }

  /** Postea un voto */
  const votar = (pollId: string, optionId?: string, aporte?: string) => {
    if (aporte) socket!.emit('poll:vote', { pollId: pollId, aporte })
    else socket!.emit('poll:vote', { pollId: pollId, optionId })
  }

  // Cuando el socket conecta...
  useEffect(() => {
    if (socket) {
      // Pedimos la lista exitente de encuestas al conectarse
      socket.emit('polls:list')

      // Conectamos el socket a sus handlers
      socket.on('polls:list', setEncuestas)
      socket.on('wss:error', showError)
      socket.on('poll:updated', updateEncuesta)
      socket.on('poll:created', addEncuesta)
      socket.on('poll:deleted', ({ pollId }) => deleteEncuesta(pollId))
      socket.on('sala:kick', ({ motivo }) => {
        toast.error(motivo)
        socket.disconnect()
        setIngresado(false)
      })

      return () => {
        socket.removeAllListeners('polls:list')
        socket.removeAllListeners('wss:error')
        socket.removeAllListeners('poll:updated')
        socket.removeAllListeners('poll:created')
        socket.removeAllListeners('poll:deleted')
      }
    }
  }, [socket])

  return {
    session,
    estado,
    error,
    encuestas,
    votar,
    nombre: auth.nombre,
    WssDebugPanel,
  }
}

// Context
export const EncuestaEstudianteContext = createContext<ReturnType<typeof useEncuestaEstudianteState> | undefined>(
  undefined
)

// Provider
export const EncuestaEstudianteProvider: React.FC<{
  auth: Omit<PasaporteEstudiante, 'rol'>
  children: React.ReactNode
}> = ({ auth, children }) => {
  return (
    <EncuestaEstudianteContext.Provider value={useEncuestaEstudianteState(auth)}>
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
