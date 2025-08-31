import { Socket } from "socket.io"
import { mount } from "./mount"
import { handlersAdmin, handlersProfe } from "./salas/handlers"
import { conSession, esAdmin, esProfe, SocketConSesion } from "./session"
import { handlersTest } from "./test/handlers"
import { salas_owners } from "./salas/app"

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

io.of(/polls\/.+?\/estudiante/).use((socket, next) => {
  const matchSalaId = socket.nsp.name.match(/^\/polls\/([a-zA-Z0-9_-]{3,50})\/estudiante$/)
  if (matchSalaId && salas_owners.has(matchSalaId[1])) {
    next()
  } else { 
    console.log(`Intento de conexión a sala inválida: ${socket.nsp.name}`)
    next(new Error(`Sala inválida`))
  }
})

io.of(/polls\/.+?\/estudiante/)
  .use((socket, next) => { 
    console.log(`Intento de conexión a namespace ${socket.nsp.name}`)
    next(new Error(`Namespace inválido`))
  })