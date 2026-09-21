import { Socket } from 'socket.io'
import { conAck, conErrorHandling } from '../middleware/error-handling'
import { SocketEstudiante, SocketProfe } from '../middleware/roles'
import { Salas } from '../salas/app'
import { avisarContrincantesActualizados, estudianteGo, salaGoRoom } from './app'
import { Partida, partidaIdSchema } from '../validators/go'

/**
 * Registra los comandos de Go de una conexión bajo una identidad (`userId`/`nombre`) dada. La
 * identidad es lo único que distingue quién juega: estudiante y profe comparten exactamente la misma
 * mecánica (invitar, jugar, observar), por eso `estudianteGo` no le pide más que un userId.
 */
async function registrarComandosGo(socket: Socket, idSala: string, userId: string, nombre: string) {
  const ack = conAck(socket)
  const go = await estudianteGo(idSala, userId)

  /** Si la partida existe, une el socket a su sala de broadcast (idempotente). */
  function seguir(partida: Partida | null) {
    if (partida) socket.join(salaGoRoom(idSala, partida.id))
    return partida
  }

  socket.on(
    'go:contrincantes',
    ack(async () => go.contrincantesDisponibles())
  )

  socket.on(
    'go:mi_partida',
    ack(async () => seguir(await go.miPartida()))
  )

  socket.on(
    'go:observar',
    ack(async (payload: unknown) => seguir(await go.observar(payload)))
  )

  socket.on(
    'go:dejar_observar',
    ack(async (payload: unknown) => {
      const { partidaId } = partidaIdSchema.parse(payload)
      socket.leave(salaGoRoom(idSala, partidaId))
    })
  )

  socket.on(
    'go:invitar',
    ack(async (payload: unknown) => seguir(await go.invitar(payload, nombre)))
  )

  socket.on(
    'go:aceptar',
    ack(async (payload: unknown) => seguir(await go.aceptar(payload)))
  )

  socket.on(
    'go:rechazar',
    ack(async (payload: unknown) => go.rechazar(payload))
  )

  socket.on(
    'go:jugar',
    ack(async (payload: unknown) => go.jugar(payload))
  )

  socket.on(
    'go:pasar',
    ack(async (payload: unknown) => go.pasar(payload))
  )

  socket.on(
    'go:marcar_muerta',
    ack(async (payload: unknown) => go.marcarMuerta(payload))
  )

  socket.on(
    'go:confirmar_conteo',
    ack(async (payload: unknown) => go.confirmarConteo(payload))
  )

  socket.on(
    'go:abandonar',
    ack(async (payload: unknown) => go.abandonar(payload))
  )
}

/**
 * Handlers de Go del estudiante, ligados a la sala a la que se conectó. Cada estudiante puede tener
 * a lo sumo una partida activa (pendiente o en curso) por sala a la vez.
 */
export const handlersGoEstudiante = async (socket: SocketEstudiante, idSala: string) => {
  const safe = conErrorHandling(socket)
  const { userId, nombre } = socket.data.session

  // Al desconectar, si no le queda otro socket vivo (multi-pestaña), avisamos a la sala que dejó de
  // estar disponible como contrincante. Al conectar avisamos siempre, más abajo, así reaparece en vivo.
  socket.on(
    'disconnect',
    safe(async () => {
      const sala = await Salas.get(idSala)
      if (!(await sala.sigueConectado(userId, socket.id))) await avisarContrincantesActualizados(idSala)
    })
  )

  await registrarComandosGo(socket, idSala, userId, nombre)

  // Recién conectado (o reconectado): avisamos a la sala que apareció como contrincante disponible.
  // A diferencia de los comandos de arriba, esto corre incondicionalmente en cada conexión (no solo al
  // ejecutar un comando de Go puntual); sin `safe`, un throw acá (ej. `Salas.get` si la sala ya no
  // existe en Redis) queda como unhandled rejection del handler de `connection` y tira abajo el proceso
  // completo del wss (ver `unhandledRejection` en `wss/mount.ts`), no solo esta conexión.
  await safe(() => avisarContrincantesActualizados(idSala))()
}

/**
 * Handlers de Go del profe: puede invitar y jugar contra los estudiantes de su sala bajo su propia
 * identidad (el email, igual que en el resto de la sesión de profe). También es un contrincante
 * disponible para ellos, así que al conectar/desconectar avisamos a la sala igual que con un
 * estudiante (ver `handlersGoEstudiante`).
 */
export const handlersGoProfe = async (socket: SocketProfe, idSala: string) => {
  const safe = conErrorHandling(socket)
  const { userId, nombre } = socket.data.session

  socket.on(
    'disconnect',
    safe(async () => {
      const sala = await Salas.get(idSala)
      if (!(await sala.profeConectado(socket.id))) await avisarContrincantesActualizados(idSala)
    })
  )

  await registrarComandosGo(socket, idSala, userId, nombre)

  // Ver comentario equivalente en `handlersGoEstudiante`: sin `safe`, un throw acá tira abajo el
  // proceso completo del wss, no solo esta conexión.
  await safe(() => avisarContrincantesActualizados(idSala))()
}
