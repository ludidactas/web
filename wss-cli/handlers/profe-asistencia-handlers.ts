import type { comandosSalaActivaProfe, EventosSalaProfe } from '@/wss/contrato/salas'
import { Socket } from 'socket.io-client'
import { toast } from 'sonner'
import { escribirAsistenciaEnDrive } from '@/lib/google/recursos-asistencia'
import { plural } from '@/lib/utils'
import { comandos, escuchar } from '../contrato-cli'

export default function profeAsistenciaHandlers(socket: Socket | null) {
  // Escribir en Drive puede tardar: el ack espera más que un comando común.
  const cmd = comandos<typeof comandosSalaActivaProfe>(socket, { timeoutMs: 10_000 })

  const alAbrirSala = async ({ sala }: { sala: { id: string; config: { nombre?: string } } }) => {
    if (!socket) return

    try {
      // Quedó asistencia de la clase pasada pendiente de grabar en drive?
      const pendientes = await cmd.pedir('sala:asistencias_pendientes')
      if (!pendientes || pendientes.length === 0) return

      const nombreSala = sala.config.nombre ?? 'Sala'
      await escribirAsistenciaEnDrive(sala.id, nombreSala, pendientes)

      // Recién con la planilla escrita las descartamos: si la subida falla o el socket se corta antes,
      // el server conserva las asistencias pendientes y se reintenta la próxima vez que se abre la sala.
      await cmd.pedir('sala:descartar_asistencias_pendientes')
      const clases = plural(pendientes.length, 'la clase anterior', 'las clases anteriores')
      toast.success(`Asistencia de ${clases} guardada en Drive (${pendientes.length} ${plural(pendientes.length, 'clase', 'clases')})`)
    } catch {
      console.warn('No se pudo guardar la asistencia pendiente en Drive')
      toast.error('No se pudo guardar la asistencia pendiente en Drive. Se reintenta la próxima vez que abras la sala.')
    }
  }

  let dejarDeEscuchar = () => {}

  return {
    montar: () => {
      dejarDeEscuchar = escuchar<EventosSalaProfe>(socket, { 'sala:abierta': alAbrirSala })
    },

    desmontar: () => dejarDeEscuchar(),
  }
}
