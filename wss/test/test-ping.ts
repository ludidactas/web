import { io } from 'socket.io-client';
import { setupSocketLogging, sleep } from './test-funcs';

// const host = 'wss://ws.ludidactas.com';
const host = 'ws://localhost:3005/polls/ff817c8b/estudiante'
// const host = 'ws://ws.ludidactas.com:3005/test'

console.log(`🔌 Connecting to server at ${host}...`);

// Connect to your server
try {

  const wsc = io(host)
  const { socket } = await setupSocketLogging(wsc)
  socket.onAny(console.log);
  await sleep(1000); // Wait for connection to stabilize
  socket.emit('ping')

} catch (error) {
  // console.error('Connection error:', error);
  console.error('Error durante el test de ping: ', error.message);
  process.exit(1);
}


process.exit(0);