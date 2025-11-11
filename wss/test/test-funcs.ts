import { io } from 'socket.io-client';

export async function setupSocketLogging(socket: ReturnType<typeof io>) { 

  const ready = new Promise<void>((resolve, reject) => {
    // Connection event handlers
    socket.on('connect', () => {
      console.log('✅ Connected to server');
      console.log('Socket ID:', socket.id);
      resolve(); // Resolve the promise when connected
    });

    socket.on('connect_error', (error) => {
      console.error('Error de ponepsión:', error.message);
      reject(error); // Reject the promise on connection error
    });
  });

  // Buffer para testear localmente las polls
  const localPolls = new Map<number, { id: string; pregunta: string, opciones: { id: number; text: string;  votos: number}[], createdAt: string; isOpen: boolean }>();

  socket.on('disconnect', () => {
    console.log('❌ Disconnected from server');
  });

  // Poll event handlers
  socket.on('polls:list', (polls) => {
    console.log('\n📋 Current polls:', polls);

    polls.forEach((poll: any) => {
      localPolls.set(poll.id, poll)
     })
  });

  socket.on('poll:created', (poll) => {
    console.log('\n✨ New poll created:', poll);

    localPolls.set(poll.id, poll);
  });

  socket.on('poll:updated', (poll) => {
    console.log('\n📊 Poll updated:', poll);

    localPolls.set(poll.id, poll)
  });

  socket.on('poll:deleted', (data) => {
    console.log('\n🗑️  Poll deleted:', data.pollId);

    localPolls.delete(data.pollId);
  });

  socket.on('poll:error', (error) => {
    console.log('\n❌ Error:', error.message);
  });

  await ready
  return { socket, localPolls }
}

export async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}