import type { comandosGoDriveProfe } from '@/wss/contrato/go'
import type { EventosSalaProfe } from '@/wss/contrato/salas'
import { nombreImagenPartida, type InfoExport } from '@/lib/go/info-export'
import { Socket } from 'socket.io-client'
import { toast } from 'sonner'
import { guardarPartidaEnDrive } from '@/lib/google/recursos-partidas'
import { tableroAPng } from '@/lib/go/exportar-png'
import { comandos, escuchar } from '../contrato-cli'

const INFO_FALLBACK: InfoExport = { negro: 'Negro', blanco: 'Blanco', ganador: null, puntos: null }

export default function profeGoDriveHandlers(socket: Socket | null) {
  const cmd = comandos<typeof comandosGoDriveProfe>(socket, { timeoutMs: 10_000 })

  const alAbrirSala = async ({ sala }: { sala: { id: string; config: { nombre?: string } } }) => {
    if (!socket) return

    try {
      const pendientes = await cmd.pedir('go:partidas_drive_pendientes')
      if (pendientes.length === 0) return

      const nombreSala = sala.config.nombre ?? 'Sala'
      const subidas: string[] = []
      let huboFallos = false

      for (const p of pendientes) {
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
        await cmd.pedir('go:descartar_partidas_drive', { ids: subidas })
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
    montar: () => escuchar<EventosSalaProfe>(socket, { 'sala:abierta': alAbrirSala }),
  }
}
