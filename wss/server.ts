import { Socket } from 'socket.io'
import db from './db'
import { conSession, SocketConSesion } from './middleware/session'
import { mount } from './mount'
import { handlersEncuestasEstudiante, handlersEncuestasProfe } from './polls/handlers'
import { handlersAdmin, handlersSalaEstudiante, handlersSalaProfe, handlersSalaPublico } from './salas/handlers'
import { handlersTest } from './test/handlers'
import { esAdmin, esProfe, SocketEstudiante, SocketProfe } from './middleware/roles'
import { conPermisosDe } from './middleware/auth'

const PORT = (process.env.PORT && parseInt(process.env.PORT)) || 3005

export const io = mount(PORT)

/** Setup de app */

// Registramos las salas preexistentes en db
const salas_preexistentes = await db.hkeys('salas')
console.log(
  `🚪 Registrando ${salas_preexistentes.length} ${
    salas_preexistentes.length === 1 ? 'sala preexistente' : 'salas preexistentes'
  } en redis...`
)
salas_preexistentes.forEach(registrarSalaEnServer)

// Canal para profes
io.of('/sala/profe')
  .use(conSession)
  .use(esProfe)
  .on('connect_error', (error) => {
    console.error(`❌ Error en /sala/profe:`, error.message)
  })
  .on('connection', async (socket: SocketProfe) => {
    await handlersSalaProfe(socket)
    await handlersEncuestasProfe(socket)
  })

// Canal para admins
io.of('/sala/admin')
  .use(conSession)
  .use(esAdmin)
  .on('connect_error', (error) => {
    console.log(`❌ Error en /sala/admin:`, error.message)
  })
  .on('connection', async (socket: SocketConSesion) => {
    await handlersAdmin(socket)
  })

// Canal de test
io.of('/test')
  .on('connect_error', (error) => {
    console.log(`❌ Error en /test:`, error.message)
  })
  .on('connection', (socket: Socket) => handlersTest(socket))

/** Setup global */

io.on('connect_error', (error) => {
  console.log(`❌ Error en /:`, error.message)
})
  .on('connection', (socket) => {
    console.log(`🔌 Conexión global: ${socket.id} en namespace ${socket.nsp.name}`)
  })
  .on('ping', (socket) => socket.emit('pong'))

io.of(/sala\/.+?\/estudiante/).use(async (socket, next) => {
  const matchSalaId = socket.nsp.name.match(/^\/sala\/([a-zA-Z0-9_-]{3,50})\/estudiante$/)

  // Vemos si la sala existe
  const salaId = matchSalaId ? matchSalaId[1] : null
  if (!salaId) {
    console.log(`❌ Intento de conexión a sala inválida: ${socket.nsp.name}`)
    return next(new Error(`Sala inválida`))
  }

  // Vemos si tiene owner
  const tiene_owner = await db.hget('salas_owners', salaId)
  if (!tiene_owner) {
    console.log(`❌ Intento de conexión a sala huérfana: ${socket.nsp.name}`)
    next(new Error(`Sala huérfana`))
  }

  next()
})

/** Crea y hace el setup del canal para estudiantes de la sala */
export function registrarSalaEnServer(salaId: string) {
  console.log(`🏫 Creando namespace para sala: /sala/${salaId}/estudiante`)

  // Registramos la sala en el servidor (endpoint de estudiantes)
  io.of(`/sala/${salaId}/estudiante`)
    .use(conSession)
    .use(conPermisosDe(salaId))
    .on('connect_error', (error) => {
      console.log(`❌ Error en /sala/${salaId}/estudiante:`, error.message)
    })
    .on('connection', async (socket: SocketEstudiante) => {
      await handlersSalaEstudiante(socket, salaId)
      await handlersEncuestasEstudiante(socket, salaId)
    })

  io.of(`/sala/${salaId}/publico`)
    // .use(conSession)
    .on('connect_error', (error) => {
      console.log(`❌ Error en /sala/${salaId}/publico:`, error.message)
    })
    .on('connection', async (socket: SocketEstudiante) => {
      await handlersSalaPublico(socket, salaId)
    })
}
