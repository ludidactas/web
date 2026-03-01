import { Socket } from 'socket.io'
import { conPermisosDeSala } from './middleware/auth'
import { conErrorLogging } from './middleware/error-handling'
import { esAdmin, esProfeOAdmin, SocketEstudiante, SocketProfe } from './middleware/roles'
import { conSession, SocketConSesion } from './middleware/session'
import { mount } from './mount'
import { handlersEncuestasEstudiante, handlersEncuestasProfe } from './polls/handlers'
import { handlersAdmin, handlersSalaEstudiante, handlersSalaProfe, handlersSalaPublico } from './salas/handlers'
import { handlersTest } from './test/handlers'

const PORT = (process.env.PORT && parseInt(process.env.PORT)) || 3005

export const io = mount(PORT)

/** Setup de app */

// Canal para profes
io.of('/sala/profe')
  .use(conSession)
  .use(esProfeOAdmin)
  .use(conErrorLogging)
  .on('connection', async (socket: SocketProfe) => {
    await handlersSalaProfe(socket)
    await handlersEncuestasProfe(socket)
  })

// Canal para admins
io.of('/sala/admin')
  .use(conSession)
  .use(esAdmin)
  .use(conErrorLogging)
  .on('connection', async (socket: SocketConSesion) => {
    await handlersAdmin(socket)
  })

// Canal de test
io.of('/test')
  .use(conErrorLogging)
  .on('connection', (socket: Socket) => handlersTest(socket))

/** Setup global */

io.use(conErrorLogging).on('connection', (socket) => {
  console.log(`🔌 Conexión global: ${socket.id} en namespace ${socket.nsp.name}`)
  socket.on('ping', (socket) => socket.emit('pong'))
})

io.of('/sala/publico')
  .use(conErrorLogging)
  .on('connection', async (socket: Socket) => {
    const salaId = socket.handshake.auth.idSala
    await handlersSalaPublico(socket, salaId)
  })

io.of('/sala/estudiante')
  .use(conSession)
  .use(conPermisosDeSala)
  .use(conErrorLogging)
  .on('connection', async (socket: SocketEstudiante) => {
    const salaId = socket.data.session.idSala
    await handlersSalaEstudiante(socket, salaId)
    await handlersEncuestasEstudiante(socket, salaId)
  })
