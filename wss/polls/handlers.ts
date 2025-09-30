import { conErrorHandling } from "../middleware"
import { getEmailProfeDeSala, getSalaById } from "../salas/app"
import { SocketEstudiante } from "../session"
import { estudianteSala } from "./app"

export const handlersEstudiante = (socket: SocketEstudiante, idSala: string) => {

  const safe = conErrorHandling(socket)

  const estudiante = estudianteSala(idSala, socket.data.session.sessionId)

  const user = socket.data.session.nombre
  const sala = getSalaById(idSala)

  console.log(`🧑‍🎓 Estudiante conectado: ${user} (sala ${idSala} de ${getEmailProfeDeSala(idSala)}, socket ${socket.id})`)

  // Notificamos al profe que un estudiante se ha conectado, y lo guardamos en la lista de estudiantes de la sala
  const notificar = safe(() => { 
    sala.estudiantes.set(socket.data.session.sessionId, true)
    sala.profe.socket.emit('sala:estudiante_conectado', socket.data.session)
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
    sala.bradcastPoll(estudiante.votar({ pollId, optionId }))
  }))

  socket.on('disconnect', safe((reason) => {
    console.log(`❌ Estudiante ${user} desconectado: ${reason}`)
    sala.estudiantes.set(socket.data.session.sessionId, false)
    sala.profe.socket.emit('sala:estudiante_desconectado', { id: socket.data.session.sessionId })
  }))

}
