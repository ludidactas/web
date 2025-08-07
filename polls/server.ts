import { Server, Socket } from "socket.io"
import { Encuesta } from "./encuestas"
import { conErrorHandling } from "./middleware"
import { estudianteSala, hidratar, profeSala } from "./polls"
import { conSession, esProfe } from "./session"
import { randomUUID } from "crypto"

const PORT = process.env.PORT && parseInt(process.env.PORT) || 3005

const io = new Server({
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
})

// Email_profe: id_sala
const owners_salas = new Map<string, string>()

/** Obtiene el ID de la sala del profe, creandola si no existe */
const getSala = (email: string) => { 
  if (!owners_salas.has(email)) { 
    const id = randomUUID()
    crearSala(id)
    owners_salas.set(email, id)
  }
  return owners_salas.get(email)!
}

/** Crea y hace el setup del canal para estudiantes de la sala */
const crearSala = (salaId: string) => { 
  // Namespace para estudiantes DE ESTA SALA
  io.of(`/polls/${salaId}/estudiante`).use(conSession).on('connection', (socket: Socket) => {
    const safe = conErrorHandling(socket)

    const user = socket.data.sessionId
    console.log(`Estudiante conectado: ${socket.data.sessionId} (sala ${salaId})`)

    const estudiante = estudianteSala(salaId, user)

    // Al conectarse el estudiante, le enviamos la lista de encuestas activas hidratadas.
    socket.emit('polls:list', estudiante.listar())

    // Estudiantes votan. Broadcasteamos la poll updateada.
    socket.on('poll:vote', safe(({ pollId, optionId }) => {
      bradcastPoll(salaId, 'poll:updated', estudiante.votar({ pollId, optionId }))
    }))
  })
}

/** Envía a admin, profe y estudiantes de la sala */
const broadcast = (salaId: string, event: string, data: unknown) => {
  io.of('/polls/admin').emit(event, data)
  io.of(`/polls/${salaId}/profe`).emit(event, data)
  io.of(`/polls/${salaId}/estudiante`).emit(event, data)
}

/** Envía a admin, profe y a estudiantes una poll pero hidratada para cada quien  */
const bradcastPoll = (salaId: string, event: string, poll: Encuesta) => {
  io.of('/polls/admin').emit(event, poll)
  io.of(`/polls/${salaId}/profe`).emit(event, poll)
  io.of(`/polls/${salaId}/estudiante`).sockets.forEach((socketEstudiante) => {
    const pollHidratada = hidratar(salaId, poll, socketEstudiante.data.sessionId)
    socketEstudiante.emit(event, pollHidratada)
  })
}

io.of(/^\/polls\/.+\/profe$/).use(conSession).use(esProfe).on('connection', socket => { 
  const safe = conErrorHandling(socket)

  // Se conectó un profe, le armamos una sala con su email como key:
  const email = socket.data.user.email
  const salaId = getSala(email)
  console.log(`Se conectó profe ${email}, sala ${salaId}`)

  const profe = profeSala(salaId)

  // Al conectarse el profe, le enviamos la lista de encuestas de su sala
  socket.emit('polls:list', profe.listar())

  // Profe puede crear una encuesta
  socket.on('poll:create', safe((poll: unknown) => {
    bradcastPoll(salaId, 'poll:created', profe.crearPoll(poll))
  }))

  // Profe puede consultar los votantes de una encuesta
  socket.on('poll:votantes', safe(({ pollId }) => {
    socket.emit('poll:votantes', { votantes: profe.consultarVotantes({ pollId }) })
  }))

  // Profe puede updatear una encuesta
  socket.on('poll:open', safe(({ pollId }) => bradcastPoll(salaId, 'poll:updated', profe.updatePoll(pollId, { isOpen: true }))))
  socket.on('poll:close', safe(({ pollId }) => bradcastPoll(salaId, 'poll:updated', profe.updatePoll(pollId, { isOpen: false }))))
  socket.on('poll:publish', safe(({ pollId }) => bradcastPoll(salaId, 'poll:updated', profe.updatePoll(pollId, { isPublished: true }))))
  socket.on('poll:hide', safe(({ pollId }) => bradcastPoll(salaId, 'poll:updated', profe.updatePoll(pollId, { isPublished: false }))))

  // Profe puede borrar
  socket.on('poll:delete', safe(({ pollId }) => {
    profe.deletePoll({ pollId })
    broadcast(salaId, 'poll:deleted', { pollId })
  }))

  socket.emit('sala:creada', { salaId })
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
