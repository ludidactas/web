import { Socket } from "socket.io"
import { mount } from "./mount"
import { handlersAdmin, handlersProfe } from "./salas/handlers"
import { conSession, esAdmin, esProfe, SocketConSesion } from "./session"
import { handlersTest } from "./test/handlers"

const PORT = process.env.PORT && parseInt(process.env.PORT) || 3005

const io = mount(PORT)

/** Setup de app */

io.of('/polls/profe').use(conSession).use(esProfe)
  .on('connect_error', (error) => { console.error(`❌ Error en /polls/profe:`, error.message) })
  .on('connection', (socket: SocketConSesion) => handlersProfe(io, socket))


io.of('/polls/admin').use(conSession).use(esAdmin)
  .on('connect_error', (error) => { console.log(`❌ Error en /polls/admin:`, error.message) })
  .on('connection', (socket: SocketConSesion) => { handlersAdmin(io, socket) })

io.of('/test')
  .on('connect_error', (error) => { console.log(`❌ Error en /test:`, error.message) })
  .on('connection', (socket: Socket) => handlersTest(io, socket))

/** Setup global */

io
  .on('connect_error', (error) => { console.log(`❌ Error en /:`, error.message) })
  .on('connection', (socket) => { console.log(`🔌 Global connection: ${socket.id} to namespace ${socket.nsp.name}`) })
  .on('ping', (socket) => socket.emit('pong'))
