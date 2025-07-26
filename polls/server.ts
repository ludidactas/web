import { Server, Socket } from "socket.io"
import { conAuth } from "./auth"
import { conErrorHandling, conUserId } from "./middleware"
import { consultarResultados, consultarVotantes, crearPoll, deletePoll, hidratadas, polls, updatePoll, votar } from "./polls"

const PORT = process.env.PORT && parseInt(process.env.PORT) || 3005

const io = new Server({
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
})

// Middleware de userId
io.use(conUserId)

// Middleware de admin
io.of('/admin').use(conAuth)

// Acciones Polls Admin
io.of('/polls/admin').on('connection', (socket: Socket) => {
  const safe = conErrorHandling(socket)

  // Al conectarse el admin, le enviamos la lista de encuestas activas
  socket.emit('polls:list', Array.from(polls.values()))

  // Admin puede crear una encuesta
  socket.on('poll:create', safe((poll: unknown) => { crearPoll(poll); io.emit('poll:created', poll) }))

  // Admin puede consultar los votantes de una encuesta
  socket.on('poll:votantes', safe(({ pollId }) => { socket.emit('poll:votantes', { votantes: consultarVotantes({ pollId }) }) }))

  // Admin puede updatear una encuesta
  socket.on('poll:open', safe(({ pollId }) => io.emit('poll:updated', updatePoll(pollId, { isOpen: true }))))
  socket.on('poll:close', safe(({ pollId }) => io.emit('poll:updated', updatePoll(pollId, { isOpen: false }))))
  socket.on('poll:publish', safe(({ pollId }) => io.emit('poll:updated', updatePoll(pollId, { isPublished: true }))))
  socket.on('poll:hide', safe(({ pollId }) => io.emit('poll:updated', updatePoll(pollId, { isPublished: false }))))

  // Admin puede borrar
  socket.on('poll:delete', safe(({ pollId }) => {
    deletePoll({ pollId })
    io.emit('poll:deleted', { pollId })
  }))
})

// Namespace para polls
io.of('/polls/estudiante').on('connection', (socket: Socket) => {
  const safe = conErrorHandling(socket)

  // Al conectarse el estudiante, le enviamos la lista de encuestas activas hidratadas.
  socket.emit('polls:list', hidratadas(socket.data.userId))

  // Estudiantes votan. Broadcasteamos la poll updateada
  socket.on('poll:vote', safe(() => { io.emit('poll:updated', votar(socket.data.userId)) }))

  // Estudiantes pueden consultar los resultados de una encuesta.
  socket.on('poll:results', safe(({ pollId }) => socket.emit('poll:results', consultarResultados(pollId))))
})



io.on('connection', (socket) => {
  console.log(`Conexión iniciada por ${socket.data.userId}, con handshake:`, socket.handshake, 'y data: ', socket.data)

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`Se desconectó ${socket.id}`)
  })
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
