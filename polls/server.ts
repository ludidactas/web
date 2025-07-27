import { Server, Socket } from "socket.io"
import { conAuth } from "./auth"
import { conErrorHandling, conUserId } from "./middleware"
import { consultarResultados, consultarVotantes, crearPoll, deletePoll, hidratadas, hidratar, polls, updatePoll, votarUser } from "./polls"
import { Encuesta } from "./encuestas"

const PORT = process.env.PORT && parseInt(process.env.PORT) || 3005

const io = new Server({
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
})

/** Envía a estudiantes y admin */
const broadcast = (event: string, data: unknown) => {
  io.of('/polls/admin').emit(event, data)
  io.of('/polls/estudiante').emit(event, data)
}

/** Envía a admin y a estudiantes una poll pero hidratada para cada quien  */
const bradcastPoll = (event: string, poll: Encuesta) => {
  io.of('/polls/admin').emit(event, poll)
  io.of('/polls/estudiante').sockets.forEach((socketEstudiante) => {
    const hydratedPoll = hidratar(poll, socketEstudiante.data.userId)
    socketEstudiante.emit(event, hydratedPoll)
  })
}

// Acciones Polls Admin
io.of('/polls/admin').use(conUserId).use(conAuth).on('connection', (socket: Socket) => {
  const safe = conErrorHandling(socket)

  console.log(`Admin conectado: ${socket.data.userId}`)

  // Al conectarse el admin, le enviamos la lista de encuestas activas
  socket.emit('polls:list', Array.from(polls.values()))

  // Admin puede crear una encuesta
  socket.on('poll:create', safe((poll: unknown) => {
    bradcastPoll('poll:created', crearPoll(poll))
  }))

  // Admin puede consultar los votantes de una encuesta
  socket.on('poll:votantes', safe(({ pollId }) => {
    socket.emit('poll:votantes', { votantes: consultarVotantes({ pollId }) })
  }))

  // Admin puede updatear una encuesta
  socket.on('poll:open', safe(({ pollId }) => bradcastPoll('poll:updated', updatePoll(pollId, { isOpen: true }))))
  socket.on('poll:close', safe(({ pollId }) => bradcastPoll('poll:updated', updatePoll(pollId, { isOpen: false }))))
  socket.on('poll:publish', safe(({ pollId }) => bradcastPoll('poll:updated', updatePoll(pollId, { isPublished: true }))))
  socket.on('poll:hide', safe(({ pollId }) => bradcastPoll('poll:updated', updatePoll(pollId, { isPublished: false }))))

  // Admin puede borrar
  socket.on('poll:delete', safe(({ pollId }) => {
    deletePoll({ pollId })
    broadcast('poll:deleted', { pollId })
  }))
})

// Namespace para polls
io.of('/polls/estudiante').use(conUserId).on('connection', (socket: Socket) => {
  const safe = conErrorHandling(socket)

  console.log(`Estudiante conectado: ${socket.data.userId}`)

  // Al conectarse el estudiante, le enviamos la lista de encuestas activas hidratadas.
  socket.emit('polls:list', hidratadas(socket.data.userId))

  // Estudiantes votan. Broadcasteamos la poll updateada.
  const votar = votarUser(socket.data.userId)
  socket.on('poll:vote', safe(({ pollId, optionId }) => {
    bradcastPoll('poll:updated', votar({pollId, optionId }))
  }))

  // Estudiantes pueden consultar los resultados de una encuesta.
  socket.on('poll:results', safe(({ pollId }) => {
    socket.emit('poll:results', consultarResultados(pollId))
  }))
})

// Start the server
io.listen(PORT)

console.log(`🚀 Servidor de polls corriendo en el puerto ${PORT}`)

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n📡 Cerrando server...')
  io.close(() => {
    console.log('Server cerrado!')
    process.exit(0)
  })
})

// Error handling
process.on('uncaughtException', (error) => {
  console.error('Error inesperado:', error)
  process.exit(1)
})

process.on('unhandledRejection', (reason, promise) => {
  console.error('Rejeccion inesperada en:', promise, 'reason:', reason)
  process.exit(1)
})
