import { Server } from "socket.io"
import type z from "zod"
import { Encuesta } from "./encuestas"
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
const votos = new Map<string, Set<string>>()

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
  if (votos.get(poll.id).has(user)) throw new Error('Ya votaste en esta encuesta')
}

function assertPollIsPublished(poll: Encuesta) {
  if (!poll.isPublished) throw new Error('La encuesta no está publicada!')
}

function assertPollIsHidden(poll: Encuesta) {
  if (poll.isPublished) throw new Error('La encuesta ya está oculta!')
}


io.on('connection', (socket) => {

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
  const pipeline = <T extends unknown[]>(...middlewares: Middleware<T>[]) => (...args: T): void => {
    for (const middleware of middlewares) middleware(...args)
  }

  // Le enviamos la lista de encuestas activas al cliente
  socket.emit('polls:list', Array.from(polls.values()))

  // Handle creating a new poll
  socket.on('poll:create', conErrorHandling(
    pipeline(
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

        // La agregamos a los polls activos y creamos el tracker de quién ya voto
        polls.set(poll.id, poll)
        votos.set(poll.id, new Set())

        // La broadcasteamos
        io.emit('poll:created', poll)

        console.log(`Encuesta creada: ${poll.pregunta}`)
      }
    )
  ))

  // Handle voting on a poll
  socket.on('poll:vote', conErrorHandling((voteData: z.infer<typeof voteValidator>) => {
    const { pollId, optionId } = voteData

    const poll = polls.get(pollId)
    const pollvotos = votos.get(pollId)

    // Validamos
    assertPollExists(pollId)
    assertPollIsOpen(poll)
    assertElUsuarioNoVotoTodavia(poll, socket.id) // Cambiar a socket.handshake.ip?

    // Guardamos el voto
    pollvotos.add(socket.id)
    poll.opciones[optionId].votos++

    // Broadcasteamos la poll updateada
    io.emit('poll:updated', poll)

    console.log(`Voto grabado: Encuesta ${pollId}, opción ${optionId}`)
  }))

  socket.on('poll:open', conErrorHandling(({ pollId, masterPassword }: { pollId: string, masterPassword: string }) => {

    // Validamos
    assertValidPassword(masterPassword)
    assertPollExists(pollId)

    const poll = polls.get(pollId)

    assertPollIsClosed(poll)

    poll.isActive = true
    io.emit('poll:updated', poll)

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
    io.emit('poll:updated', poll)

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
    io.emit('poll:updated', poll)

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
    io.emit('poll:updated', poll)

    console.log(`Encuesta ocultada: ${poll.pregunta}`)
  }))

  // GET poll
  socket.on('poll:results', conErrorHandling((pollId) => {
    const poll = polls.get(pollId)
    if (poll) {
      socket.emit('poll:results', poll)
    }
  }))

  // DELETE poll
  socket.on('poll:delete', conErrorHandling(({ pollId, masterPassword }: { pollId: string, masterPassword: string }) => {

    // Validamos
    assertValidPassword(masterPassword)
    assertPollExists(pollId)

    if (polls.has(pollId)) {
      polls.delete(pollId)
      votos.delete(pollId)
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
