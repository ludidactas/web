import { toast } from "sonner"
import { Pasaporte, StatusDeConexion, useConexionWss } from "./use-conexion-wss"
import { useEffect } from "react"

export function useServerWebsockets(auth: Pasaporte) {
  const { estado, error, ...etc } = useConexionWss(auth)

  // Reaccionamos con efectos de UI
  useEffect(() => { 
    // console.log(`Estado de conexión:`, estado, error)
    if (estado === StatusDeConexion.Error && error) {
      toast.error(estado)
    }
    if (estado === StatusDeConexion.Expirado) {
      toast.error("Sesión expirada, reestableciendo...")
    }
  }, [estado, error])

  return { estado, error, ...etc }
}
