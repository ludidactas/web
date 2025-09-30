import { ExtendedError, Server } from "socket.io"
import { conErrorHandling } from "../middleware"
import { profeSala } from "../polls/app"
import { handlersEstudiante } from "../polls/handlers"
import { conSession, SocketConSesion, SocketEstudiante, SocketProfe } from "../session"
import { getEstudiantesEnSala, obtenerOCrearSala } from "./app"

export const handlersProfe = (socket: SocketProfe) => {

  const safe = conErrorHandling(socket)

  if (!socket.data.user.email) throw new Error('Profe sin email en sesión!')

  // Se conectó un profe, le armamos una sala con su email como key:
  const sala = obtenerOCrearSala(socket)
  const profe = profeSala(sala.profe.email)
  console.log(`🔌 Se conectó profe ${sala.profe.email}, sala ${sala.id}`)

  socket.on('sala:listar_estudiantes', safe(() => {
    socket.emit('sala:estudiantes', getEstudiantesEnSala(sala.id))
  }))

  socket.on('sala:limpar_estudiantes_sala', safe(() => {
    sala.limpiarEstudiantes()
    socket.emit('sala:estudiantes', sala.listarEstudiantes())
  }))

  socket.on('poll:create', safe((poll: unknown, responder: (error?: ExtendedError) => void) => {
    try {
      const nueva = profe.crearPoll(poll)
      sala.bradcastPoll(nueva)
      responder()
    } catch (e: any) {
      console.error('Error creando encuesta:', e)
      responder(e.message)
    }
  }))

  socket.on('poll:votantes', safe(({ pollId }) => {
    socket.emit('poll:votantes', { votantes: profe.consultarVotantes({ pollId }) })
  }))

  socket.on('poll:open', safe(({ pollId }) => sala.bradcastPoll(profe.updatePoll(pollId, { isOpen: true }))))
  socket.on('poll:close', safe(({ pollId }) => sala.bradcastPoll(profe.updatePoll(pollId, { isOpen: false }))))
  socket.on('poll:publish', safe(({ pollId }) => sala.bradcastPoll(profe.updatePoll(pollId, { isPublished: true }))))
  socket.on('poll:hide', safe(({ pollId }) => sala.bradcastPoll(profe.updatePoll(pollId, { isPublished: false }))))

  socket.on('poll:delete', safe(({ pollId }) => {
    profe.deletePoll({ pollId })
    sala.broadcast('poll:deleted', { pollId })
  }))

  socket.on('sala:abrir', safe(() => {
    socket.emit('sala:abierta', { sala, polls: profe.listarEncuestas(), estudiantes: getEstudiantesEnSala(sala.id) })
  }))

  socket.on('disconnect', (reason) => {
    console.log(`❌ Profe ${sala.profe.email} desconectado: ${reason}`)
  })

}

export const handlersAdmin = (socket: SocketConSesion) => {
  console.log(`✅ Admin conectado: ${socket.id}`)

  socket.on('disconnect', (reason) => {
    console.log(`❌ Admin ${socket.id} desconectado: ${reason}`)
  })
}

/** Crea y hace el setup del canal para estudiantes de la sala */
export const registrarSala = (io: Server, salaId: string) => {
  console.log(`🏫 Creando namespace para sala: /polls/${salaId}/estudiante`)

  // Registramos la sala en el servidor (endpoint de estudiantes)
  io.of(`/polls/${salaId}/estudiante`).use(conSession)
    .on('connect_error', (error) => { console.log(`❌ Error en /polls/${salaId}/estudiante:`, error.message) })
    .on('connection', (socket: SocketEstudiante) => handlersEstudiante(socket, salaId))
}
