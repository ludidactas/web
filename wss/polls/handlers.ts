import { ExtendedError } from "socket.io"
import { conErrorHandling } from "../middleware"
import { getEmailProfeDeSala, getSalaByEmailProfe, getSalaById } from "../salas/app"
import { SocketEstudiante, SocketProfe } from "../session"
import { estudianteSala, broadcastPoll, profeSala } from "./app"

export const handlersEncuestasProfe = async (socket: SocketProfe) => {
  const safe = conErrorHandling(socket)

  const sala = await getSalaByEmailProfe(socket.data.user.email)
  const profe = await profeSala(sala.profe.email)

  socket.on('poll:create', safe(async (poll: unknown, responder: (error?: ExtendedError) => void) => {
    try {
      const nueva = await profe.crearPoll(poll)
      await broadcastPoll(sala, nueva)
      responder()
    } catch (e: any) {
      console.error('Error creando encuesta:', e)
      responder(e.message)
    }
  }))

  socket.on('poll:votantes', safe(async ({ pollId }) => {
    socket.emit('poll:votantes', { votantes: await profe.consultarVotantes({ pollId }) })
  }))

  socket.on('poll:open', safe(async ({ pollId }) => await broadcastPoll(sala, await profe.updatePoll(pollId, { isOpen: true }))))
  socket.on('poll:close', safe(async ({ pollId }) => await broadcastPoll(sala, await profe.updatePoll(pollId, { isOpen: false }))))
  socket.on('poll:publish', safe(async ({ pollId }) => await broadcastPoll(sala, await profe.updatePoll(pollId, { isPublished: true }))))
  socket.on('poll:hide', safe(async ({ pollId }) => await broadcastPoll(sala, await profe.updatePoll(pollId, { isPublished: false }))))
  socket.on('poll:reveal', safe(async ({ pollId }) => await broadcastPoll(sala, await profe.updatePoll(pollId, { isRevealed: true }))))
  socket.on('poll:unreveal', safe(async ({ pollId }) => await broadcastPoll(sala, await profe.updatePoll(pollId, { isRevealed: false }))))
  socket.on('poll:focus', safe(async ({ pollId }) => await broadcastPoll(sala, await profe.focusPoll(pollId)) ))

  socket.on('poll:delete', safe(async ({ pollId }) => {
    await profe.deletePoll({ pollId })
    await sala.broadcast('poll:deleted', { pollId })
  }))
}

export const handlersEncuestasEstudiante = async (socket: SocketEstudiante, idSala: string) => {
  const safe = conErrorHandling(socket)

  const user = socket.data.session.nombre
  const sala = await getSalaById(idSala)
  
  const estudiante = await estudianteSala(idSala, socket.data.session.sessionId)

  console.log(`🧑‍🎓 Estudiante conectado: ${user} (sala ${idSala} de ${await getEmailProfeDeSala(idSala)}, socket ${socket.id})`)

  // Al conectarse el estudiante, le enviamos la lista de encuestas activas hidratadas.
  socket.emit('polls:list', await estudiante.listar())

  // Si las pide, se las enviamos también
  socket.on('polls:list', safe(async () => {
    socket.emit('polls:list', await estudiante.listar())
  }))

  // Estudiantes votan. Broadcasteamos la poll updateada.
  socket.on('poll:vote', safe(async ({ pollId, optionId, aporte }) => {
    const votando_que = aporte ? `con aporte "${aporte}"` : `opción ${optionId}`
    console.log(`🗳️  Estudiante ${user} votando en poll ${pollId}...`, votando_que)
    await broadcastPoll(sala, await estudiante.votar({ pollId, optionId, aporte }))
  }))

}
