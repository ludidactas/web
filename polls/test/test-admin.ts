import { io } from 'socket.io-client';
import type z from 'zod';
import type { pollBase } from '../validators';
import { setupSocketLogging, sleep } from './test-funcs';

// const host = process.env.HOST || 'localhost';
// const puerto = process.env.PORT && parseInt(process.env.PORT) || 3005;
const host = 'ws.ludidactas.com';
const puerto = 3005;

console.log(`🔌 Connecting to server at https://${host}...`);

// Connect to your server
const { socket } = await setupSocketLogging(io(`wss://${host}`))

// Test functions you can call manually
function createPoll(pregunta: string, opciones: string[]) {
  socket.emit('poll:create', { pregunta, opciones, masterPassword: 'dificildeaveriguar' });
}

function closePoll(pollId: number) {
  socket.emit('poll:close', pollId);
}

function deletePoll(pollId: number) {
  socket.emit('poll:delete', pollId);
}

await sleep(1000); // Wait for connection to stabilize

const testPoll: z.infer<typeof pollBase> = {
  pregunta: "Cuál es tu lenguaje de programación favorito?",
  opciones: ["JavaScript", "Python", "Java", "Go", "Rust"]
};


console.log('🧪 Test admin started');

await sleep(1000); // Wait a bit before creating the poll

console.log('\n🗳️  Creating test poll...');
createPoll(testPoll.pregunta, testPoll.opciones);

await sleep(60 * 60 * 1000); // Admin una hora activo

console.log('\n🗳️  Closing test poll...')
closePoll(1);