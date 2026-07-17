'use client'

import React, { createContext, useContext, useEffect, useMemo } from 'react'

import { RolSala } from '@/wss/validators/auth'
import { PasaporteProfe } from '@/wss/validators/auth'

import baseSalaHandlers from '../handlers/base-sala-handlers'
import profeSalaHandlers from '../handlers/profe-sala-handlers'
import profeEncuestasHandlers from '../handlers/profe-encuestas-handlers'
import { useWss } from '../use-wss'

/** Cose el socket con el state para profe */
const useHandlersConexionSalaProfe = (auth: Omit<PasaporteProfe, 'rol'>, opts?: { autoConectar?: boolean }) => {
  const { socket, estado, error, iniciarConexion, WssDebugPanel } = useWss({ ...auth, rol: RolSala.Profe }, opts)

  // Cuando cambia el socket, re-definimos los handlers con el nuevo socket
  const handlers = useMemo(
    () => ({
      profe: profeSalaHandlers(socket),
      base: baseSalaHandlers(socket),
      encuestas: profeEncuestasHandlers(socket),
    }),
    [socket]
  )

  // Conectamos el socket a sus handlers
  useEffect(() => {
    handlers.profe.montar()
    handlers.base.montar()
    handlers.encuestas.montar()

    return () => {
      handlers.profe.desmontar()
      handlers.base.desmontar()
      handlers.encuestas.desmontar()
    }
  }, [handlers])

  return {
    socket,
    estado,
    error,
    // Dispara la conexión a mano (para cuando `autoConectar` es `false` y hay que esperar una acción explícita, p.ej. "Crear")
    conectar: () => iniciarConexion({ ...auth, rol: RolSala.Profe }),
    ...handlers.profe.acciones,
    ...handlers.base.acciones,
    ...handlers.encuestas.acciones,
    WssDebugPanel,
  }
}

// Context
const ConexionProfeContext = createContext<ReturnType<typeof useHandlersConexionSalaProfe> | undefined>(undefined)

// Provider - El auth viene del server
export const ConexionProfeProvider: React.FC<{
  auth: Omit<PasaporteProfe, 'rol'>
  /** Si es `false`, no conecta el socket solo al montar: espera a que se llame `conectar()` explícitamente. Default `true`. */
  autoConectar?: boolean
  children: React.ReactNode
}> = ({ auth, autoConectar, children }) => {
  return (
    <ConexionProfeContext.Provider value={useHandlersConexionSalaProfe(auth, { autoConectar })}>
      {children}
    </ConexionProfeContext.Provider>
  )
}

// Hook para usar el contexto de Encuesta
export const useConexionProfe = () => {
  const context = useContext(ConexionProfeContext)
  if (!context) {
    throw new Error('Intentando usar useEncuestaAdmin fuera del EncuestaAdminProvider')
  }
  return context
}
