import { Server, Socket } from "socket.io"


export const handlersTest = (io: Server, socket: Socket) => {
    console.log('Tester conectado')
    socket.on('ping', () => socket.emit('pong', {
      mensaje: "tu vieja"
    }))
}