import { Server } from "socket.io"
import { conErrorHandling } from "../middleware"
import { getEmailProfeDeSala, getSalaById, getSocketProfeDeSala } from "../salas/app"
import { SocketConSesion } from "../session"
import { Encuesta } from "../tipos"
import { estudianteSala, hidratar } from "./app"

/** Envía a admin, profe y a estudiantes una poll pero hidratada para cada quien  */
export const bradcastPoll = (io: Server, salaId: string, event: string, poll: Encuesta) => {
  console.log(`📡 Broadcasteando encuesta ${poll.id || 'desconocida (!)'} a sala ${salaId} (sala de ${getEmailProfeDeSala(salaId)})`)

  // La emitimos al profe de la sala
  getSocketProfeDeSala(salaId).emit(event, poll)

  // Al admin
  io.of('/polls/admin').emit(event, poll)

  // La emitimos a los estudiantes de la sala también
  // (antes no estaba emitiendo si no estaba publicada, pero eso resultaba en que no llegaba la notificación de apertura :facepalm:)
  io.of(`/polls/${salaId}/estudiante`).sockets.forEach((socketEstudiante: SocketConSesion) => {
    const pollHidratada = hidratar(salaId, poll, socketEstudiante.data.session.sessionId)
    socketEstudiante.emit(event, pollHidratada)
  })
}


export const handlersEstudiante = (io: Server, socket: SocketConSesion, idSala: string) => {

  const safe = conErrorHandling(socket)

  const estudiante = estudianteSala(idSala, socket.data.session.sessionId)

  const user = socket.data.session.nombre

  console.log(`✅ Estudiante conectado: ${user} (sala ${idSala} de ${getEmailProfeDeSala(idSala)}, socket ${socket.id})`)

  // Notificamos al profe que un estudiante se ha conectado, y lo guardamos en la lista de estudiantes de la sala
  const notificar = safe(() => { 
    getSalaById(idSala).estudiantes.set(socket.data.session.sessionId, true)
    getSocketProfeDeSala(idSala).emit('sala:estudiante_conectado', socket.data.session)
  })
  notificar()

  // Al conectarse el estudiante, le enviamos la lista de encuestas activas hidratadas.
  socket.emit('polls:list', estudiante.listar())

  // Si las pide, se las enviamos también
  socket.on('polls:list', safe(() => {
    socket.emit('polls:list', estudiante.listar())
  }))

  // Estudiantes votan. Broadcasteamos la poll updateada.
  socket.on('poll:vote', safe(({ pollId, optionId }) => {
    console.log(`🗳️  Estudiante ${user} votando en poll ${pollId} opción ${optionId}...`)
    bradcastPoll(io, idSala, 'poll:updated', estudiante.votar({ pollId, optionId }))
  }))

  socket.on('disconnect', safe((reason) => {
    console.log(`❌ Estudiante ${user} desconectado: ${reason}`)
    getSalaById(idSala).estudiantes.set(socket.data.session.sessionId, false)
    getSocketProfeDeSala(idSala).emit('sala:estudiante_desconectado', { id: socket.data.session.sessionId })
  }))

}
