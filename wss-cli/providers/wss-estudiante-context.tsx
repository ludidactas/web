'use client'

import React, { createContext, useContext, useEffect, useMemo } from 'react'

import { RolSala } from '@/wss/validators/auth'
import { PasaporteEstudiante } from '@/wss/validators/auth'

import baseSalaHandlers from '../handlers/base-sala-handlers'
import estudianteSalaHandlers from '../handlers/estudiante-sala-handlers'
import estudianteEncuestasHandlers from '../handlers/estudiante-encuestas-handlers'

import { StatusDeConexion } from '../conexion-wss'
import { storeConfig } from '../stores/config-store'
import { storeEstudianteLogin } from '../stores/estudiante-login-store'
import { storeInvitado } from '../stores/invitado-store'
import { useWss } from '../use-wss'

/** Cose el socket con el state para estudiante */
const useHandlersConexionSalaEstudiante = (auth: Omit<PasaporteEstudiante, 'rol'>) => {
  const { socket, ...wss } = useWss({
    ...auth,
    rol: RolSala.Estudiante,
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

  // Al salir de la sala limpiamos su config y estado de invitado para no dejar valores stale al navegar
  useEffect(
    () => () => {
      storeConfig.getState().set(null)
      storeInvitado.getState().reset()
    },
    []
  )

  // Si el servidor rechaza la sesión, volvemos al login
  useEffect(() => {
    if (wss.estado === StatusDeConexion.Rechazado) {
      localStorage.setItem(`encuestas-ingresado-${auth.idSala}`, '0')
      storeEstudianteLogin.getState().setIngresado(false)
    }
  }, [wss.estado, auth.idSala])

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
}> = ({ auth, children }) => (
  <ConexionEstudianteContext.Provider value={useHandlersConexionSalaEstudiante(auth)}>
    {children}
  </ConexionEstudianteContext.Provider>
)

// Hook para usar el contexto de Encuesta
export const useConexionEstudiante = () => {
  const context = useContext(ConexionEstudianteContext)
  if (!context) {
    throw new Error('Intentando usar useEncuestaEstudiante fuera del EncuestaEstudianteProvider')
  }
  return context
}
