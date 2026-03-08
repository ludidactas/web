'use client'

import React, { createContext, useContext, useEffect, useMemo } from 'react'

import { RolEncuesta } from '@/wss/tipos'
import { PasaporteEstudiante } from '@/wss/validators/auth'

import baseSalaHandlers from '../handlers/base-sala-handlers'
import estudianteSalaHandlers from '../handlers/estudiante-sala-handlers'
import estudianteEncuestasHandlers from '../handlers/estudiante-encuestas-handlers'

import { useWss } from '../use-wss'

/** Cose el socket con el state para estudiante */
const useHandlersConexionSalaEstudiante = (auth: Omit<PasaporteEstudiante, 'rol'>) => {
  const { socket, ...wss } = useWss({
    ...auth,
    rol: RolEncuesta.Estudiante,
  })

  // Computamos los handlers (que conectan el socket con el state)...
  const handlers = useMemo(
    () => ({
      base: baseSalaHandlers(socket),
      sala: estudianteSalaHandlers(socket),
      encuestas: estudianteEncuestasHandlers(socket),
    }),
    [socket]
  )

  // Cuando el socket conecta...
  useEffect(() => {
    // ...los montamos...
    handlers.base.montar()
    handlers.sala.montar()
    handlers.encuestas.montar()

    // ...y al desmontar el componente, los desmontamos también.
    return () => {
      handlers.base.desmontar()
      handlers.sala.desmontar()
      handlers.encuestas.desmontar()
    }
  }, [socket])

  return {
    ...wss,
    ...handlers.base.acciones,
    ...handlers.sala.acciones,
    ...handlers.encuestas.acciones,
    nombre: auth.nombre,
  }
}

// Context
export const ConexionEstudianteContext = createContext<
  ReturnType<typeof useHandlersConexionSalaEstudiante> | undefined
>(undefined)

// Provider
export const ConexionEstudianteProvider: React.FC<{
  auth: Omit<PasaporteEstudiante, 'rol'>
  children: React.ReactNode
}> = ({ auth, children }) => {
  return (
    <ConexionEstudianteContext.Provider value={useHandlersConexionSalaEstudiante(auth)}>
      {children}
    </ConexionEstudianteContext.Provider>
  )
}

// Hook para usar el contexto de Encuesta
export const useConexionEstudiante = () => {
  const context = useContext(ConexionEstudianteContext)
  if (!context) {
    throw new Error('Intentando usar useEncuestaEstudiante fuera del EncuestaEstudianteProvider')
  }
  return context
}
