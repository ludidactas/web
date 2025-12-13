import { Pasaporte } from "@/wss/validators/auth"
import { useEffect } from "react"
import { toast } from "sonner"
import { useWss } from "./use-wss"
import { StatusDeConexion } from "./use-conexion-wss"

/** Conecta la conexión al WebSocket Server con elementos de UI (toasts) */
export function useServerWebsockets(auth: Pasaporte) {
  const { estado, error, ...etc } = useWss(auth)

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
