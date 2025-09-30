import { Socket } from "socket.io"
import { mount } from "./mount"
import { handlersAdmin, handlersSalaEstudiante, handlersSalaProfe } from "./salas/handlers"
import { conSession, esAdmin, esProfe, SocketConSesion, SocketEstudiante, SocketProfe } from "./session"
import { handlersTest } from "./test/handlers"
import { salas_owners } from "./salas/app"
import { handlersEncuestasEstudiante, handlersEncuestasProfe } from "./polls/handlers"

const PORT = process.env.PORT && parseInt(process.env.PORT) || 3005

export const io = mount(PORT)

/** Setup de app */

io.of('/polls/profe').use(conSession).use(esProfe)
  .on('connect_error', (error) => { console.error(`❌ Error en /polls/profe:`, error.message) })
  .on('connection', (socket: SocketProfe) => {
    handlersSalaProfe(socket)
    handlersEncuestasProfe(socket)
  })


io.of('/polls/admin').use(conSession).use(esAdmin)
  .on('connect_error', (error) => { console.log(`❌ Error en /polls/admin:`, error.message) })
  .on('connection', (socket: SocketConSesion) => { handlersAdmin(socket) })

io.of('/test')
  .on('connect_error', (error) => { console.log(`❌ Error en /test:`, error.message) })
  .on('connection', (socket: Socket) => handlersTest(socket))

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
    console.log(`❌ Intento de conexión a sala inválida: ${socket.nsp.name}`)
    next(new Error(`Sala inválida`))
  }
})

/** Crea y hace el setup del canal para estudiantes de la sala */
export const registrarSalaEnServer = (salaId: string) => {
  console.log(`🏫 Creando namespace para sala: /polls/${salaId}/estudiante`)

  // Registramos la sala en el servidor (endpoint de estudiantes)
  io.of(`/polls/${salaId}/estudiante`).use(conSession)
    .on('connect_error', (error) => { console.log(`❌ Error en /polls/${salaId}/estudiante:`, error.message) })
    .on('connection', (socket: SocketEstudiante) => {
      handlersSalaEstudiante(socket, salaId)
      handlersEncuestasEstudiante(socket, salaId)
    })
}
