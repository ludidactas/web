import { Server, Socket } from "socket.io"
import { getEmailProfeDeSala, getSocketProfeDeSala } from "../salas/app"
import { Encuesta } from "../tipos"
import { estudianteSala, hidratar } from "./app"
import { conErrorHandling } from "../middleware"
import { SocketConSesion } from "../session"

/** Envía a admin, profe y a estudiantes una poll pero hidratada para cada quien  */
export const bradcastPoll = (io: Server, salaId: string, event: string, poll: Encuesta) => {
  console.log(`📡 Broadcasting poll ${poll.id || 'unknown'} to sala ${salaId} (sala de ${getEmailProfeDeSala(salaId)})`)

  // La emitimos al profe de la sala
  getSocketProfeDeSala(salaId).emit(event, poll)

  // Al admin
  io.of('/polls/admin').emit(event, poll)

  // La emitimos a los estudiantes de la sala también
  // (antes no estaba emitiendo si no estaba publicada, pero eso resultaba en que no llegaba la notificación de apertura :facepalm:)
  io.of(`/polls/${salaId}/estudiante`).sockets.forEach((socketEstudiante: SocketConSesion) => {
    console.log(`Enviando poll a estudiante ${socketEstudiante.data.session.nombre}`)
    const pollHidratada = hidratar(salaId, poll, socketEstudiante.data.session.sessionId)
    socketEstudiante.emit(event, pollHidratada)
  })
}


export const handlersEstudiante = (io: Server, socket: Socket, idSala: string) => {

  const safe = conErrorHandling(socket)

  const estudiante = estudianteSala(idSala, socket.data.session.sessionId)

  // Al conectarse el estudiante, le enviamos la lista de encuestas activas hidratadas.
  socket.emit('polls:list', estudiante.listar())

  // Si las pide, se las enviamos también
  socket.on('polls:list', safe(() => {
    socket.emit('polls:list', estudiante.listar())
  }))

  // Estudiantes votan. Broadcasteamos la poll updateada.
  socket.on('poll:vote', safe(({ pollId, optionId }) => {
    bradcastPoll(io, idSala, 'poll:updated', estudiante.votar({ pollId, optionId }))
  }))

}
