import { Server, Socket } from "socket.io"
import type z from "zod"
import { Encuesta, EncuestaHidratada } from "./encuestas"
import { extractZodErrorMessages } from "./utils"
import { pollCreator, pollValidator, voteValidator } from "./validators"

const PORT = process.env.PORT && parseInt(process.env.PORT) || 3005

const io = new Server({
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
})

// Polls y votos activos
const polls = new Map<string, Encuesta>()
const votantes = new Map<string, Set<string>>()
const votos = new Map<string, Map<string, string>>()

const masterPwd = process.env.POLLS_ADMIN_PASS
if (!masterPwd) {
  console.error("Error: POLLS_ADMIN_PASS no está seteada.")
  process.exit(1)
}

function assertValidPassword(pwd: string) {
  if (pwd !== masterPwd) throw new Error('Contraseña maestra incorrecta')
}

function assertValidPoll(pollData: unknown) {
  const { error } = pollValidator.safeParse(pollData)
  if (error) throw new Error(`Encuesta inválida: ${extractZodErrorMessages(error)}`)
}

function assertPollExists(pollId: string) {
  if (!polls.has(pollId)) throw new Error('La encuesta no existe!')
}

function assertPollIsOpen(poll: Encuesta) {
  if (!poll.isActive) throw new Error('La encuesta ya cerró!')
}

function assertPollIsClosed(poll: Encuesta) {
  if (poll.isActive) throw new Error('La encuesta ya está abierta!!')
}

function assertElUsuarioNoVotoTodavia(poll: Encuesta, user: string) {
  if (votantes.get(poll.id).has(user)) throw new Error('Ya votaste en esta encuesta')
}

function assertPollIsPublished(poll: Encuesta) {
  if (!poll.isPublished) throw new Error('La encuesta no está publicada!')
}

function assertPollIsHidden(poll: Encuesta) {
  if (poll.isPublished) throw new Error('La encuesta ya está oculta!')
}

function id(socket: Socket) {
  return socket.handshake.address
  return socket.id
}


io.on('connection', (socket) => {

  const userId = id(socket)

  console.log(`Conexión de ${userId}`)

  // Functiones de arquitectura, orquestan la ejecución de las otras:
  type Middleware<T extends unknown[]> = (...args: T) => void

  /** Wrapper de handlers que agrega error handling */
  function conErrorHandling<T extends unknown[]>(f: Middleware<T>) {
    return (...args: T) => {
      try {
        f(...args)
      } catch (err: unknown) {
        if (!(err instanceof Error)) {
          console.error('Error inesperado:', err)
          return
        }
        console.error('Error en el handler:', err.message)
        socket.emit('poll:error', { message: err.message })
      }
    }
  }

  /** Recibe una lista de funciones y las corre en secuencia */
  // const pipeline = <T extends unknown[]>(...middlewares: Middleware<T>[]) => (...args: T): void => {
  //   for (const middleware of middlewares) middleware(...args)
  // }

  /** Hidrata una encuesta con la info del cliente */
  const hidratar = (poll: Encuesta): EncuestaHidratada => ({
    ...poll,
    puedoVotar: !votantes.get(poll.id).has(userId),
    votoEmitido: votantes.get(poll.id).has(userId) ? votos.get(poll.id).get(userId) : undefined
  })

  // Le enviamos la lista de encuestas activas al cliente
  socket.emit('polls:list', Array.from(polls.values()).map(hidratar))

  // Handle creating a new poll
  socket.on('poll:create', conErrorHandling(
    (pollData: z.infer<typeof pollCreator>) => {

      console.log(`Request de creación de `, pollData)

      assertValidPassword(pollData.masterPassword)
      assertValidPoll(pollData)

      // La creamos
      const poll: Encuesta = {
        id: Date.now().toString(),
        pregunta: pollData.pregunta,
        opciones: pollData.opciones.map((opc, i) => ({ id: i.toString(), texto: opc, votos: 0 })),
        createdAt: new Date().toISOString(),
        isActive: true,
        isPublished: false,
      }

      // La agregamos a los polls activos y creamos el tracker de quién ya voto y qué
      polls.set(poll.id, poll)
      votantes.set(poll.id, new Set())
      votos.set(poll.id, new Map())

      // La broadcasteamos
      io.emit('poll:created', poll)

      console.log(`Encuesta creada: ${poll.pregunta}`)
    }
  )
  )

  // Handle voting on a poll
  socket.on('poll:vote', conErrorHandling((voteData: z.infer<typeof voteValidator>) => {
    const { pollId, optionId } = voteData

    const poll = polls.get(pollId)
    const personasQueYaVotaron = votantes.get(pollId)
    const votosEmitidos = votos.get(pollId)

    // Validamos
    assertPollExists(pollId)
    assertPollIsOpen(poll)
    assertElUsuarioNoVotoTodavia(poll, userId) // Cambiar a socket.handshake.ip?

    // Guardamos el voto
    poll.opciones[optionId].votos++
    personasQueYaVotaron.add(userId)
    votosEmitidos.set(userId, optionId)

    // Broadcasteamos la poll updateada
    io.emit('poll:updated', hidratar(poll))

    console.log(`Voto grabado: Encuesta ${pollId}, opción ${optionId}`)
  }))

  socket.on('poll:votantes', conErrorHandling(({ pollId, masterPassword }: { pollId: string, masterPassword: string }) => {
    assertValidPassword(masterPassword)
    assertPollExists(pollId)

    const poll = polls.get(pollId)
    const votantesSet = votantes.get(pollId)

    if (poll && votantesSet) {
      const votantesList = Array.from(votantesSet).map(user => ({
        userId: user,
        voto: votos.get(pollId).get(user)
      }))
      socket.emit('poll:votantes', { pollId, votantes: votantesList })
    }
  }))

  socket.on('poll:open', conErrorHandling(({ pollId, masterPassword }: { pollId: string, masterPassword: string }) => {

    // Validamos
    assertValidPassword(masterPassword)
    assertPollExists(pollId)

    const poll = polls.get(pollId)

    assertPollIsClosed(poll)

    poll.isActive = true
    io.emit('poll:updated', hidratar(poll))

    console.log(`Encuesta abierta: ${poll.pregunta}`)
  }))

  // Handle closing a poll
  socket.on('poll:close', conErrorHandling(({ pollId, masterPassword }: { pollId: string, masterPassword: string }) => {

    // Validamos
    assertValidPassword(masterPassword)
    assertPollExists(pollId)

    const poll = polls.get(pollId)

    assertPollIsOpen(poll)

    poll.isActive = false
    io.emit('poll:updated', hidratar(poll))

    console.log(`Encuesta cerrada: ${poll.pregunta}`)
  }))

  // Handle closing a poll
  socket.on('poll:publish', conErrorHandling(({ pollId, masterPassword }: { pollId: string, masterPassword: string }) => {

    console.log(`Request de publicación de encuesta ${pollId}`)

    // Validamos
    assertValidPassword(masterPassword)
    assertPollExists(pollId)

    const poll = polls.get(pollId)

    assertPollIsHidden(poll)

    poll.isPublished = true
    io.emit('poll:updated', hidratar(poll))

    console.log(`Encuesta publicada: ${poll.pregunta}`)
  }))

  // Handle closing a poll
  socket.on('poll:hide', conErrorHandling(({ pollId, masterPassword }: { pollId: string, masterPassword: string }) => {

    console.log(`Request de ocultación de encuesta ${pollId}`)

    // Validamos
    assertValidPassword(masterPassword)
    assertPollExists(pollId)

    const poll = polls.get(pollId)

    assertPollIsPublished(poll)

    poll.isPublished = false
    io.emit('poll:updated', hidratar(poll))

    console.log(`Encuesta ocultada: ${poll.pregunta}`)
  }))

  // GET poll
  socket.on('poll:results', conErrorHandling((pollId) => {
    const poll = polls.get(pollId)
    if (poll) {
      socket.emit('poll:results', hidratar(poll))
    }
  }))

  // DELETE poll
  socket.on('poll:delete', conErrorHandling(({ pollId, masterPassword }: { pollId: string, masterPassword: string }) => {

    // Validamos
    assertValidPassword(masterPassword)
    assertPollExists(pollId)

    if (polls.has(pollId)) {
      polls.delete(pollId)
      votantes.delete(pollId)
      io.emit('poll:deleted', { pollId })
      console.log(`Poll deleted: ${pollId}`)
    }
  }))

  // Handle disconnection
  socket.on('disconnect', conErrorHandling(() => {
    console.log(`Se desconectó ${socket.id}`)
  }))
})

// Start the server
io.listen(PORT)

console.log(`🚀 Live Polls server running on port ${PORT}`)

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n📡 Shutting down server...')
  io.close(() => {
    console.log('Server closed')
    process.exit(0)
  })
})

// Error handling
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error)
  process.exit(1)
})

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason)
  process.exit(1)
})
