import { Server, Socket } from "socket.io"
import { Encuesta } from "./encuestas"
import { conErrorHandling } from "./middleware"
import { estudianteSala, hidratar, profeSala } from "./polls"
import { conSession, esProfe, SocketConSesion } from "./session"
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
const salas_owners = new Map<string, string>()
const sockets_profes = new Map<string, Socket>()

/** Obtiene el ID de la sala del profe, creandola si no existe */
const getSala = (email: string) => {
  if (!owners_salas.has(email)) {
    const id = randomUUID().split('-')[0]
    console.log(`Creando sala ${id} para profe ${email}`)
    crearSala(id)
    owners_salas.set(email, id)
    salas_owners.set(id, email)
  }
  return owners_salas.get(email)!
}

const getOwner = (salaId: string) => {
  return salas_owners.get(salaId) || "Desconocido"
}

/** Crea y hace el setup del canal para estudiantes de la sala */
const crearSala = (salaId: string) => {
  // Namespace para estudiantes DE ESTA SALA
  io.of(`/polls/${salaId}/estudiante`).use(conSession).on('connection', (socket: SocketConSesion) => {
    const safe = conErrorHandling(socket)

    const user = socket.data.session.nombre
    console.log(`Estudiante conectado: ${user} (sala ${salaId} de ${getOwner(salaId)})`)

    const estudiante = estudianteSala(salaId, socket.data.session.sessionId)

    // Al conectarse el estudiante, le enviamos la lista de encuestas activas hidratadas.
    socket.emit('polls:list', estudiante.listar())

    // Si las pide, se las enviamos también
    socket.on('polls:list', safe(() => {
      socket.emit('polls:list', estudiante.listar())
    }))

    // Estudiantes votan. Broadcasteamos la poll updateada.
    socket.on('poll:vote', safe(({ pollId, optionId }) => {
      bradcastPoll(salaId, 'poll:updated', estudiante.votar({ pollId, optionId }))
    }))
  })
}

/** Envía a admin, profe y estudiantes de la sala */
const broadcast = (salaId: string, event: string, data: unknown) => {
  io.of('/polls/admin').emit(event, data)
  sockets_profes.get(getOwner(salaId))?.emit(event, data)

  io.of(`/polls/${salaId}/estudiante`).sockets.forEach((socketEstudiante) => { socketEstudiante.emit(event, data) })
}

/** Envía a admin, profe y a estudiantes una poll pero hidratada para cada quien  */
const bradcastPoll = (salaId: string, event: string, poll: Encuesta) => {
  console.log(`Broadcasting poll ${JSON.stringify(poll)} to sala ${salaId} (${getOwner(salaId)})`)

  // La emitimos al profe y admin
  sockets_profes.get(getOwner(salaId))?.emit(event, poll)
  io.of('/polls/admin').emit(event, poll)

  // Si la poll está publicada, la emitimos a los estudiantes de la sala también
  io.of(`/polls/${salaId}/estudiante`).sockets.forEach((socketEstudiante) => {
    const pollHidratada = hidratar(salaId, poll, socketEstudiante.data.sessionId)
    socketEstudiante.emit(event, pollHidratada)
  })
}

io.of('/polls/profe').use(conSession).use(esProfe).on('connection', (socket: SocketConSesion) => {
  const safe = conErrorHandling(socket)

  // Se conectó un profe, le armamos una sala con su email como key:
  const email = socket.data.user.email!
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

  // Guardamos el socket del profe para enviarle notificaciones de su sala
  sockets_profes.set(email, socket)

  socket.on('sala:abrir', safe(() => {
    socket.emit('sala:abierta', { salaId, polls: profe.listar() })
  }))
})

io.of('/test').on('connection', (socket: Socket) => { 
  console.log('Tester conectado')
  socket.on('ping', () => socket.emit('pong', {
    profes: io.of('/polls/profe').sockets.size,
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
