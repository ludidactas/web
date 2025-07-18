import { Server, Socket } from "socket.io";
import { pollCreator, pollValidator, voteValidator } from "./validators";
import type z from "zod";

const PORT = process.env.PORT && parseInt(process.env.PORT) || 3005;

const io = new Server({
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Polls y votos activos
const polls = new Map();
const votos = new Map();

const masterPwd = process.env.MASTER_PASSWORD || 'dificildeaveriguar';

function checkPassword(pwd: string, socket: Socket) {
  if (pwd !== masterPwd) {
    socket.emit('poll:error', { message: 'Contraseña maestra incorrecta' });
    return false;
  }
  return true;
}

function extractZodErrorMessages(error: z.ZodError): string {
  return error.issues.map(err => `${err.path.join('.')} - ${err.message}`).join(', ');
}

function isValidPoll(pollData: unknown, socket: Socket): boolean {
  const { success, error } = pollValidator.safeParse(pollData);
  if (!success) {
    socket.emit('poll:error', { message: `Encuesta inválida: ${extractZodErrorMessages(error)}` });
    return false;
  }
  return true;
}

io.on('connection', (socket) => {

  // Le enviamos la lista de encuestas activas al cliente
  socket.emit('polls:list', Array.from(polls.values()));

  // Handle creating a new poll
  socket.on('poll:create', (pollData: z.infer<typeof pollCreator>) => {

    console.log(`Request de creación de `, pollData)

    if (!checkPassword(pollData.masterPassword, socket)) return
    if (!isValidPoll(pollData, socket)) return

    // Create a new poll object
    const poll = {
      id: Date.now().toString(),
      pregunta: pollData.pregunta,
      opciones: pollData.opciones.map((opc, i) => ({id: i, texto: opc, votos: 0})),
      createdAt: new Date().toISOString(),
      isActive: true
    };

    polls.set(poll.id, poll);
    votos.set(poll.id, new Set()); // Track who voted

    // Broadcast new poll to all clients
    io.emit('poll:created', poll);

    console.log(`Encuesta creada: ${poll.pregunta}`);
  });

  // Handle voting on a poll
  socket.on('poll:vote', (voteData: z.infer<typeof voteValidator>) => {
    const { pollId, optionId } = voteData;
    const poll = polls.get(pollId);
    const pollvotos = votos.get(pollId);

    // Check if poll exists and is active
    if (!poll) {
      socket.emit('poll:error', { message: `La encuesta ${pollId} no existe!` });
      return;
    }

    if (!poll.isActive) {
      socket.emit('poll:error', { message: `La encuesta ${pollId} ya cerró!` });
      return;
    }

    // Check if ip already voted (simple implementation using socket.id)
    if (pollvotos.has(socket.id)) {
      socket.emit('poll:error', { message: 'Ya votaste en esta encuesta' });
      return;
    }

    // Record the vote
    // pollvotos.add(socket.handshake.address);
    pollvotos.add(socket.id);
    poll.opciones[optionId].votos++;

    // Broadcast updated poll results to all clients
    io.emit('poll:updated', poll);

    console.log(`Voto grabado: Encuesta ${pollId}, opción ${optionId}`);
  });

  // Handle closing a poll
  socket.on('poll:close', ({ pollId, masterPassword }: { pollId: number, masterPassword: string }) => {
    // Solo el admin puede cerrar la encuesta
    if (!polls.has(pollId)) {
      socket.emit('poll:error', { message: `La encuesta ${pollId} no existe!` });
      return;
    }

    // Check for master masterPassword if provided
    if (!masterPassword || masterPassword !== masterPwd) {
      socket.emit('poll:error', { message: 'Contraseña maestra incorrecta' });
      return;
    }

    const poll = polls.get(pollId);

    if (!poll.isActive) {
      socket.emit('poll:error', { message: `La encuesta ${pollId} ya cerró!` });
      return;
    }

    if (poll) {
      poll.isActive = false;
      io.emit('poll:closed', poll);
      console.log(`Encuesta cerrada: ${poll.pregunta}`);
    }
  });

  // Handle getting poll results
  socket.on('poll:results', (pollId) => {
    const poll = polls.get(pollId);
    if (poll) {
      socket.emit('poll:results', poll);
    }
  });

  // Handle deleting a poll
  socket.on('poll:delete', ({ pollId, masterPassword }: { pollId: string, masterPassword: string }) => {
    if (!polls.has(pollId)) {
      socket.emit('poll:error', { message: `La encuesta ${pollId} no existe!` });
      return;
    }

    // Check for master masterPassword if provided
    if (!masterPassword || masterPassword !== masterPwd) {
      socket.emit('poll:error', { message: 'Contraseña maestra incorrecta' });
      return;
    }

    if (polls.has(pollId)) {
      polls.delete(pollId);
      votos.delete(pollId);
      io.emit('poll:deleted', { pollId });
      console.log(`Poll deleted: ${pollId}`);
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
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
