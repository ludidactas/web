'use client'
import { PasaportePublico } from '@/wss/validators/auth'
import { RolSala } from '@/wss/validators/auth'
import { createContext, useContext, useEffect, useMemo } from 'react'
import baseSalaHandlers from '../handlers/base-sala-handlers'
import overlayEncuestasHandlers from '../handlers/overlay-encuestas-handlers'
import { useWss } from '../use-wss'

const useHandlersConexionSalaOverlay = (auth: Omit<PasaportePublico, 'rol'>) => {
  const { socket, estado, error } = useWss({ ...auth, rol: RolSala.Publico })

  const handlers = useMemo(
    () => ({
      base: baseSalaHandlers(socket),
      overlay: overlayEncuestasHandlers(socket),
    }),
    [socket]
  )

  useEffect(() => {
    handlers.base.montar()
    handlers.overlay.montar()

    return () => {
      handlers.base.desmontar()
      handlers.overlay.desmontar()
    }
  }, [socket])

  return {
    estado,
    error,
    ...handlers.base.acciones,
  }
}

const ConexionOverlayContext = createContext<ReturnType<typeof useHandlersConexionSalaOverlay> | undefined>(undefined)

export const ConexionOverlayProvider: React.FC<{ auth: Omit<PasaportePublico, 'rol'>; children: React.ReactNode }> = ({
  auth,
  children,
}) => {
  return (
    <ConexionOverlayContext.Provider value={useHandlersConexionSalaOverlay(auth)}>
      {children}
    </ConexionOverlayContext.Provider>
  )
}

export const useConexionOverlay = () => {
  const context = useContext(ConexionOverlayContext)
  if (!context) {
    throw new Error('Intentando usar useConexionOverlay fuera del ConexionOverlayProvider')
  }
  return context
}
