import { rooms } from '../rooms'
import { Socket } from 'socket.io'
import { comandosGo } from '../contrato/go'
import { alDesconectar, registrar } from '../contrato/registrar'
import { SocketEstudiante, SocketProfe } from '../middleware/roles'
import { Salas } from '../salas/app'
import { avisarContrincantesActualizados, estudianteGo } from './app'
import { Partida } from '../validators/go'

/**
 * Registra los comandos de Go de una conexión bajo una identidad (`userId`/`nombre`) dada. La
 * identidad es lo único que distingue quién juega: estudiante y profe comparten exactamente la misma
 * mecánica (invitar, jugar, observar), por eso `estudianteGo` no le pide más que un userId.
 */
async function registrarComandosGo(socket: Socket, idSala: string, userId: string, nombre: string) {
  const go = await estudianteGo(idSala, userId)

  /** Si la partida existe, une el socket a su sala de broadcast (idempotente). */
  function seguir<T extends Partida | null>(partida: T): T {
    if (partida) socket.join(rooms.partidaGo(idSala, partida.id))
    return partida
  }

  registrar(socket, comandosGo, {
    'go:contrincantes': async () => go.contrincantesDisponibles(),
    'go:mi_partida': async () => seguir(await go.miPartida()),
    'go:observar': async (payload) => seguir(await go.observar(payload)),
    'go:dejar_observar': async ({ partidaId }) => {
      socket.leave(rooms.partidaGo(idSala, partidaId))
    },
    'go:invitar': async (payload) => seguir(await go.invitar(payload, nombre)),
    'go:aceptar': async (payload) => seguir(await go.aceptar(payload)),
    'go:rechazar': async (payload) => go.rechazar(payload),
    'go:jugar': async (payload) => go.jugar(payload),
    'go:pasar': async (payload) => go.pasar(payload),
    'go:marcar_muerta': async (payload) => go.marcarMuerta(payload),
    'go:confirmar_conteo': async (payload) => go.confirmarConteo(payload),
    'go:abandonar': async (payload) => go.abandonar(payload),
  })
}

/**
 * Handlers de Go del estudiante, ligados a la sala a la que se conectó. Cada estudiante puede tener
 * a lo sumo una partida activa (pendiente o en curso) por sala a la vez. Registra los comandos y
 * devuelve el init: avisar a la sala que apareció como contrincante disponible.
 */
export const handlersGoEstudiante = async (socket: SocketEstudiante, idSala: string) => {
  const { userId, nombre } = socket.data.session

  // Si no le queda otro socket vivo (multi-pestaña), la sala deja de verlo como contrincante disponible.
  alDesconectar(socket, async () => {
    const sala = await Salas.get(idSala)
    if (!(await sala.sigueConectado(userId, socket.id))) await avisarContrincantesActualizados(idSala)
  })

  await registrarComandosGo(socket, idSala, userId, nombre)

  return () => avisarContrincantesActualizados(idSala)
}

/**
 * Handlers de Go del profe: puede invitar y jugar contra los estudiantes de su sala bajo su propia
 * identidad (el email, igual que en el resto de la sesión de profe). También es un contrincante
 * disponible para ellos, así que al conectar/desconectar avisamos a la sala igual que con un
 * estudiante (ver `handlersGoEstudiante`, que también describe el init que devuelve).
 */
export const handlersGoProfe = async (socket: SocketProfe, idSala: string) => {
  const { userId, nombre } = socket.data.session

  alDesconectar(socket, async () => {
    const sala = await Salas.get(idSala)
    if (!(await sala.profeConectado(socket.id))) await avisarContrincantesActualizados(idSala)
  })

  await registrarComandosGo(socket, idSala, userId, nombre)

  return () => avisarContrincantesActualizados(idSala)
}
