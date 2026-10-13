import type { Ack } from '@/wss/middleware/error-handling'
import type { Tablero } from '@/lib/go/motor'
import type { TamañoTablero } from '@/wss/validators/go'
import { nombreImagenPartida, type InfoExport } from '@/lib/go/info-export'
import { Socket } from 'socket.io-client'
import { toast } from 'sonner'
import { guardarPartidaEnDrive } from '@/lib/google/recursos-partidas'
import { tableroAPng } from '@/lib/go/exportar-png'

type PartidaDrivePendiente = {
  id: string
  tablero: Tablero
  tamaño: TamañoTablero
  removidas: boolean[][] | null
  creadaEn: string
  info?: InfoExport
}

const INFO_FALLBACK: InfoExport = { negro: 'Negro', blanco: 'Blanco', ganador: null, puntos: null }

export default function profeGoDriveHandlers(socket: Socket | null) {
  const alAbrirSala = async ({ sala }: { sala: { id: string; config: { nombre?: string } } }) => {
    if (!socket) return

    try {
      const res: Ack<PartidaDrivePendiente[]> = await socket
        .timeout(10000)
        .emitWithAck('go:partidas_drive_pendientes')
      if (!res.ok || !res.data || res.data.length === 0) return

      const nombreSala = sala.config.nombre ?? 'Sala'
      const subidas: string[] = []
      let huboFallos = false

      for (const p of res.data) {
        try {
          const info = p.info ?? INFO_FALLBACK
          const png = await tableroAPng(p.tablero, p.tamaño, p.removidas, info)
          await guardarPartidaEnDrive(sala.id, nombreSala, p.id, nombreImagenPartida(info, p.creadaEn), png)
          subidas.push(p.id)
        } catch {
          huboFallos = true
        }
      }

      if (subidas.length > 0) {
        await socket.timeout(10000).emitWithAck('go:descartar_partidas_drive', { ids: subidas })
        toast.success(`Partidas de Go guardadas en Drive (${subidas.length})`)
      }

      if (huboFallos) {
        console.warn('Algunas partidas no se pudieron guardar en Drive')
        toast.error('No se pudieron guardar partidas de Go en Drive. Se reintenta la próxima vez que abras la sala.')
      }
    } catch {
      console.warn('No se pudieron guardar las partidas pendientes en Drive')
      toast.error('No se pudieron guardar partidas de Go en Drive. Se reintenta la próxima vez que abras la sala.')
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
