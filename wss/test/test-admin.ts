import { io } from 'socket.io-client';
import { setupSocketLogging, sleep } from './test-funcs';

// const host = 'wss://ws.ludidactas.com';
const host = 'http://localhost:3005/test'

console.log(`🔌 Connecting to server at ${host}...`);

// Connect to your server
const { socket } = await setupSocketLogging(io(host))
socket.onAny(console.log);

await sleep(1000); // Wait for connection to stabilize

socket.emit('ping')