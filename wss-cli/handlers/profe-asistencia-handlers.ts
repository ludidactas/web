import type { Ack } from '@/wss/middleware/error-handling'
import type { AsistenciaDeClase } from '@/wss/validators/asistencia'
import { Socket } from 'socket.io-client'
import { toast } from 'sonner'
import { escribirAsistenciaEnDrive } from '@/lib/google/recursos-asistencia'
import { plural } from '@/lib/utils'

export default function profeAsistenciaHandlers(socket: Socket | null) {
  // El handler `profe-sala-activa-handlers` también escucha `sala:abierta`, así que no
  // podemos desmontar con `removeAllListeners` sin matar al otro (y viceversa).
  const alAbrirSala = async ({ sala }: { sala: { id: string; config: { nombre?: string } } }) => {
    if (!socket) return

    try {
      // Quedó asistencia de la clase pasada pendiente de grabar en drive?
      const res: Ack<AsistenciaDeClase[]> = await socket.timeout(10000).emitWithAck('sala:asistencias_pendientes')
      if (!res.ok || !res.data || res.data.length === 0) return

      const nombreSala = sala.config.nombre ?? 'Sala'
      await escribirAsistenciaEnDrive(sala.id, nombreSala, res.data)

      // Recién con la planilla escrita las descartamos: si la subida falla o el socket se corta antes,
      // el server conserva las asistencias pendientes y se reintenta la próxima vez que se abre la sala.
      await socket.timeout(10000).emitWithAck('sala:descartar_asistencias_pendientes')
      const clases = plural(res.data.length, 'la clase anterior', 'las clases anteriores')
      toast.success(`Asistencia de ${clases} guardada en Drive (${res.data.length} ${plural(res.data.length, 'clase', 'clases')})`)
    } catch {
      console.warn('No se pudo guardar la asistencia pendiente en Drive')
      toast.error('No se pudo guardar la asistencia pendiente en Drive. Se reintenta la próxima vez que abras la sala.')
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
