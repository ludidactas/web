'use client'

import React, { createContext, useContext, useEffect, useMemo } from 'react'

import { RolSala } from '@/wss/validators/auth'
import { PasaporteProfe } from '@/wss/validators/auth'

import baseSalaHandlers from '../handlers/base-sala-handlers'
import profeGestionSalasHandlers from '../handlers/profe-gestion-salas-handlers'
import profeSalaActivaHandlers from '../handlers/profe-sala-activa-handlers'
import profeEncuestasHandlers from '../handlers/profe-encuestas-handlers'
import profeAsistenciaHandlers from '../handlers/profe-asistencia-handlers'
import profeGoHandlers from '../handlers/profe-go-handlers'
import { useWss } from '../use-wss'
import { StatusDeConexion } from '../conexion-wss'
import { storeConfig } from '../stores/config-store'
import { storeGo } from '../stores/go-store'

/**
 * Cose el socket del profe con su state. La conexión es token-only (identidad); qué sala se opera se
 * decide con `sala:abrir`. Si se pasa `abrirSalaId`, apenas conecta abre esa sala (la usa la página
 * de operación `/salas/[idSala]`); sin él, la conexión queda en modo gestión (la usa `/salas`).
 */
const useHandlersConexionSalaProfe = (auth: Omit<PasaporteProfe, 'rol'>, abrirSalaId?: string) => {
  const { socket, estado, error, WssDebugPanel } = useWss({ ...auth, rol: RolSala.Profe })

  // Cuando cambia el socket, re-definimos los handlers con el nuevo socket
  const handlers = useMemo(
    () => ({
      gestion: profeGestionSalasHandlers(socket),
      salaActiva: profeSalaActivaHandlers(socket),
      base: baseSalaHandlers(socket),
      encuestas: profeEncuestasHandlers(socket),
      asistencia: profeAsistenciaHandlers(socket),
      go: profeGoHandlers(socket),
    }),
    [socket]
  )

  // Conectamos el socket a sus handlers. Go es el único que emite algo (`go:mi_partida`) apenas
  // monta: el server solo registra ese listener cuando hay una sala abierta (`sala:abrir`), así que en
  // modo gestión (sin `abrirSalaId`, ver `/salas`) el pedido nunca tiene quien lo conteste y termina
  // siempre en el toast de error tras agotar los reintentos. Lo montamos solo si vamos a abrir una sala.
  useEffect(() => {
    handlers.gestion.montar()
    handlers.salaActiva.montar()
    handlers.base.montar()
    handlers.encuestas.montar()
    handlers.asistencia.montar()
    if (abrirSalaId) handlers.go.montar()

    return () => {
      handlers.gestion.desmontar()
      handlers.salaActiva.desmontar()
      handlers.base.desmontar()
      handlers.encuestas.desmontar()
      handlers.asistencia.desmontar()
      if (abrirSalaId) handlers.go.desmontar()
    }
  }, [handlers, abrirSalaId])

  // Página de operación: apenas la conexión está lista, abrimos la sala pedida.
  useEffect(() => {
    if (abrirSalaId && estado === StatusDeConexion.Conectado) handlers.gestion.acciones.abrirSala(abrirSalaId)
  }, [abrirSalaId, estado, handlers])

  // Al salir de la sala limpiamos su config y estado de Go para no dejar valores stale al navegar.
  useEffect(
    () => () => {
      storeConfig.getState().set(null)
      storeGo.getState().resetConexion()
    },
    []
  )

  return {
    socket,
    estado,
    error,
    ...handlers.gestion.acciones,
    ...handlers.salaActiva.acciones,
    ...handlers.base.acciones,
    ...handlers.encuestas.acciones,
    ...handlers.go.acciones,
    WssDebugPanel,
  }
}

// Context
const ConexionProfeContext = createContext<ReturnType<typeof useHandlersConexionSalaProfe> | undefined>(undefined)

export const ConexionProfeProvider: React.FC<{
  auth: Omit<PasaporteProfe, 'rol'>
  abrirSalaId?: string
  children: React.ReactNode
}> = ({ auth, abrirSalaId, children }) => {
  return (
    <ConexionProfeContext.Provider value={useHandlersConexionSalaProfe(auth, abrirSalaId)}>
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
