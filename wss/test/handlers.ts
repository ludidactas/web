import { Socket } from "socket.io"


export const handlersTest = (socket: Socket) => {
  console.log('Tester conectado')
  socket.on('ping', () => {
    console.log('ping')
    socket.emit('pong', {
      mensaje: "tu vieja"
    })
  })
}