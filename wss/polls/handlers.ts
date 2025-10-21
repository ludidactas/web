import { ExtendedError } from "socket.io"
import { conErrorHandling } from "../middleware"
import { getEmailProfeDeSala, getSalaByEmailProfe, getSalaById } from "../salas/app"
import { SocketEstudiante, SocketProfe } from "../session"
import { estudianteSala, broadcastPoll, profeSala } from "./app"

export const handlersEncuestasProfe = (socket: SocketProfe) => {
  const safe = conErrorHandling(socket)

  const sala = getSalaByEmailProfe(socket.data.user.email)
  const profe = profeSala(sala.profe.email)

  socket.on('poll:create', safe((poll: unknown, responder: (error?: ExtendedError) => void) => {
    try {
      const nueva = profe.crearPoll(poll)
      broadcastPoll(sala, nueva)
      responder()
    } catch (e: any) {
      console.error('Error creando encuesta:', e)
      responder(e.message)
    }
  }))

  socket.on('poll:votantes', safe(({ pollId }) => {
    socket.emit('poll:votantes', { votantes: profe.consultarVotantes({ pollId }) })
  }))

  socket.on('poll:open', safe(({ pollId }) => broadcastPoll(sala, profe.updatePoll(pollId, { isOpen: true }))))
  socket.on('poll:close', safe(({ pollId }) => broadcastPoll(sala, profe.updatePoll(pollId, { isOpen: false }))))
  socket.on('poll:publish', safe(({ pollId }) => broadcastPoll(sala, profe.updatePoll(pollId, { isPublished: true }))))
  socket.on('poll:hide', safe(({ pollId }) => broadcastPoll(sala, profe.updatePoll(pollId, { isPublished: false }))))
  socket.on('poll:focus', safe(({ pollId }) => {
    // Si ya hay una focuseada, la desfocuseamos
    const encuestaFocuseada = sala.polls.values().find(e => e.isFocused)
    if (encuestaFocuseada) broadcastPoll(sala, profe.updatePoll(encuestaFocuseada.id, { isFocused: false }))
    // Focuseamos
    broadcastPoll(sala, profe.updatePoll(pollId, { isFocused: true }))
  }))

  socket.on('poll:delete', safe(({ pollId }) => {
    profe.deletePoll({ pollId })
    sala.broadcast('poll:deleted', { pollId })
  }))
}

export const handlersEncuestasEstudiante = (socket: SocketEstudiante, idSala: string) => {

  const safe = conErrorHandling(socket)

  const estudiante = estudianteSala(idSala, socket.data.session.sessionId)

  const user = socket.data.session.nombre
  const sala = getSalaById(idSala)

  console.log(`🧑‍🎓 Estudiante conectado: ${user} (sala ${idSala} de ${getEmailProfeDeSala(idSala)}, socket ${socket.id})`)

  // Al conectarse el estudiante, le enviamos la lista de encuestas activas hidratadas.
  socket.emit('polls:list', estudiante.listar())

  // Si las pide, se las enviamos también
  socket.on('polls:list', safe(() => {
    socket.emit('polls:list', estudiante.listar())
  }))

  // Estudiantes votan. Broadcasteamos la poll updateada.
  socket.on('poll:vote', safe(({ pollId, optionId }) => {
    console.log(`🗳️  Estudiante ${user} votando en poll ${pollId} opción ${optionId}...`)
    broadcastPoll(sala, estudiante.votar({ pollId, optionId }))
  }))

}
