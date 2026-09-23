import type { Ack } from '@/wss/middleware/error-handling'
import type { AsistenciaDeClase } from '@/wss/validators/asistencia'
import { Socket } from 'socket.io-client'
import { toast } from 'sonner'
import { escribirAsistenciaEnDrive } from '@/lib/google/recursos-asistencia'

export default function profeAsistenciaHandlers(socket: Socket | null) {
  // El handler `profe-sala-activa-handlers` también escucha `sala:abierta`, así que no
  // podemos desmontar con `removeAllListeners` sin matar al otro (y viceversa).
  const alAbrirSala = async ({ sala }: { sala: { id: string; config: { nombre?: string } } }) => {
    if (!socket) return

    try {
      const res: Ack<AsistenciaDeClase[]> = await socket.timeout(10000).emitWithAck('sala:asistencias_pendientes')
      if (!res.ok || !res.data || res.data.length === 0) return

      const nombreSala = sala.config.nombre ?? 'Sala'
      await escribirAsistenciaEnDrive(sala.id, nombreSala, res.data)
      // Recién con la planilla escrita las descartamos: si la subida falla o el socket se corta antes,
      // el server conserva las asistencias pendientes y se reintenta la próxima vez que se abre la sala.
      await socket.timeout(10000).emitWithAck('sala:descartar_asistencias_pendientes')
      toast.success(`Asistencia guardada en Drive (${res.data.length} clase${res.data.length > 1 ? 's' : ''})`)
    } catch {
      console.warn('No se pudo guardar la asistencia pendiente en Drive')
    }
  }

  return {
    montar: () => {
      if (!socket) return

      socket.on('sala:abierta', alAbrirSala)
    },

    desmontar: () => {
      socket?.off('sala:abierta', alAbrirSala)
    },
  }
}
