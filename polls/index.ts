import { Server, Socket } from "socket.io";
import { pollCreator, pollValidator, voteValidator } from "./validators";
import type z from "zod";
import { extractZodErrorMessages } from "./utils";
import { Encuesta } from "./encuestas";

const PORT = process.env.PORT && parseInt(process.env.PORT) || 3005;

const io = new Server({
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Polls y votos activos
const polls = new Map<string, Encuesta>();
const votos = new Map<string, Set<string>>();

const masterPwd = process.env.POLLS_ADMIN_PASS;
if (!masterPwd) {
  console.error("Error: POLLS_ADMIN_PASS no está seteada.");
  process.exit(1);
}

function assertValidPassword(pwd: string, socket: Socket) {
  if (pwd !== masterPwd) {
    socket.emit('poll:error', { message: 'Contraseña maestra incorrecta' });
    return false;
  }
  return true;
}

function assertValidPoll(pollData: unknown, socket: Socket): boolean {
  const { success, error } = pollValidator.safeParse(pollData);
  if (!success) {
    socket.emit('poll:error', { message: `Encuesta inválida: ${extractZodErrorMessages(error)}` });
    return false;
  }
  return true;
}

function assertPollExists(pollId: string, socket: Socket): boolean {
  if (!polls.has(pollId)) {
    socket.emit('poll:error', { message: `La encuesta no existe!` });
    return false;
  }
  return true;
}

function assertPollIsOpen(poll: Encuesta, socket: Socket): boolean {
  if (!poll.isActive) {
    socket.emit('poll:error', { message: `La encuesta ya cerró!` });
    return false;
  }
  return true;
}

function assertPollIsClosed(poll: Encuesta, socket: Socket): boolean {
  if (poll.isActive) {
    socket.emit('poll:error', { message: `La encuesta ya está abierta!!` });
    return false;
  }
  return true;
}

function assertElUsuarioNoVotoTodavia(poll: Encuesta, user: string, socket: Socket): boolean {
  if (votos.get(poll.id).has(user)) {
    socket.emit('poll:error', { message: 'Ya votaste en esta encuesta' });
    return false;
  }
  return true;
}

io.on('connection', (socket) => {

  // function conErrorHandling(f: Parameters<typeof Socket['on']>[1]) {
  //   try {
  //     f();
  //   } catch (error) {
  //     console.error('Error en el handler:', error);
  //     socket.emit('poll:error', { message: 'Error interno del servidor' });
  //   }
  // }

  // Le enviamos la lista de encuestas activas al cliente
  socket.emit('polls:list', Array.from(polls.values()));

  // Handle creating a new poll
  socket.on('poll:create', (pollData: z.infer<typeof pollCreator>) => {

    console.log(`Request de creación de `, pollData)

    if (!assertValidPassword(pollData.masterPassword, socket)) return
    if (!assertValidPoll(pollData, socket)) return

    // La creamos
    const poll: Encuesta = {
      id: Date.now().toString(),
      pregunta: pollData.pregunta,
      opciones: pollData.opciones.map((opc, i) => ({ id: i.toString(), texto: opc, votos: 0 })),
      createdAt: new Date().toISOString(),
      isActive: false
    };

    // La agregamos a los polls activos y creamos el tracker de quién ya voto
    polls.set(poll.id, poll);
    votos.set(poll.id, new Set());

    // La broadcasteamos
    io.emit('poll:created', poll);

    console.log(`Encuesta creada: ${poll.pregunta}`);
  });

  // Handle voting on a poll
  socket.on('poll:vote', (voteData: z.infer<typeof voteValidator>) => {
    const { pollId, optionId } = voteData;

    const poll = polls.get(pollId);
    const pollvotos = votos.get(pollId);

    // Validamos
    if (!assertPollExists(pollId, socket)) return
    if (!assertPollIsOpen(poll, socket)) return
    if (!assertElUsuarioNoVotoTodavia(poll, socket.id, socket)) return // Cambiar a socket.handshake.ip?

    // Guardamos el voto
    pollvotos.add(socket.id);
    poll.opciones[optionId].votos++;

    // Broadcasteamos la poll updateada
    io.emit('poll:updated', poll);

    console.log(`Voto grabado: Encuesta ${pollId}, opción ${optionId}`);
  });

  socket.on('poll:open', ({ pollId, masterPassword }: { pollId: string, masterPassword: string }) => {

    // Validamos
    if (!assertValidPassword(masterPassword, socket)) return
    if (!assertPollExists(pollId, socket)) return

    const poll = polls.get(pollId);

    if (!assertPollIsClosed(poll, socket)) return;

    poll.isActive = true;
    io.emit('poll:opened', poll);

    console.log(`Encuesta abierta: ${poll.pregunta}`);
  })

  // Handle closing a poll
  socket.on('poll:close', ({ pollId, masterPassword }: { pollId: string, masterPassword: string }) => {

    // Validamos
    if (!assertValidPassword(masterPassword, socket)) return
    if (!assertPollExists(pollId, socket)) return

    const poll = polls.get(pollId);

    if (!assertPollIsOpen(poll, socket)) return;

    poll.isActive = false;
    io.emit('poll:closed', poll);

    console.log(`Encuesta cerrada: ${poll.pregunta}`);
  });

  // GET poll
  socket.on('poll:results', (pollId) => {
    const poll = polls.get(pollId);
    if (poll) {
      socket.emit('poll:results', poll);
    }
  });

  // DELETE poll
  socket.on('poll:delete', ({ pollId, masterPassword }: { pollId: string, masterPassword: string }) => {

    // Validamos
    if (!assertValidPassword(masterPassword, socket)) return;
    if (!assertPollExists(pollId, socket)) return;

    if (polls.has(pollId)) {
      polls.delete(pollId);
      votos.delete(pollId);
      io.emit('poll:deleted', { pollId });
      console.log(`Poll deleted: ${pollId}`);
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`Se desconectó ${socket.id}`);
  });
});

// Start the server
io.listen(PORT);

console.log(`🚀 Live Polls server running on port ${PORT}`);

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n📡 Shutting down server...');
  io.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

// Error handling
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});
