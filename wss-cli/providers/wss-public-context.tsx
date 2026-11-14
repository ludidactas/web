import { useWss } from '../use-wss'
import { montarTodos } from '../contrato-cli'
import { PasaportePublico, RolSala } from '@/wss/validators/auth'
import { createContext, useContext, useEffect, useMemo } from 'react'
import baseSalaHandlers from '../handlers/base-sala-handlers'
import useConfirmarConDelay from '@/components/hooks/use-delay'
import { StatusDeConexion } from '../conexion-wss'

const useHandlersConexionSalaPublico = (auth: Omit<PasaportePublico, 'rol'>) => {
  const { socket, estado, error } = useWss({ ...auth, rol: RolSala.Publico })

  // El único rechazo posible de un cliente público es que la sala no exista: es definitivo, sin demora.
  const confirmadoNoExiste = estado === StatusDeConexion.Rechazado

  // Aguantamos un segundo antes de confirmar que la sala no existe
  const { valor: posibleError, confirmado: confirmadoError } = useConfirmarConDelay(
    () => estado === StatusDeConexion.Error,
    1000
  )

  const averiguandoEstado = posibleError && !confirmadoError

  // Computamos los handlers (que conectan el socket con el state)...
  const handlers = useMemo(
    () => ({
      base: baseSalaHandlers(socket),
    }),
    [socket]
  )

  // Cuando el socket conecta...
  // Cuando el socket conecta, los montamos; al desmontar el componente, los desmontamos.
  useEffect(() => montarTodos(handlers), [handlers])

  return {
    estado,
    error,
    confirmadoNoExiste,
    confirmadoError,
    averiguandoEstado,
    ...handlers.base.acciones,
  }
}

// Context
const ConexionPublicoContext = createContext<ReturnType<typeof useHandlersConexionSalaPublico> | undefined>(undefined)

// Provider - El auth viene del server
export const ConexionPublicProvider: React.FC<{ auth: Omit<PasaportePublico, 'rol'>; children: React.ReactNode }> = ({
  auth,
  children,
}) => {
  return (
    <ConexionPublicoContext.Provider value={useHandlersConexionSalaPublico(auth)}>
      {children}
    </ConexionPublicoContext.Provider>
  )
}

// Hook para usar el contexto de Encuesta
export const useConexionPublico = () => {
  const context = useContext(ConexionPublicoContext)
  if (!context) {
    throw new Error('Intentando usar useConexionPublico fuera del ConexionPublicProvider')
  }
  return context
}
