import { isNullish } from 'remeda'
import { conErrorLogging } from './middleware/error-handling'
import { SocketEstudiante, SocketProfe } from './middleware/roles'
import { conSession, SocketConSesion } from './middleware/session'
import { mount } from './mount'
import { handlersEncuestasEstudiante, handlersEncuestasOverlay, handlersEncuestasProfe } from './polls/handlers'
import { handlersAdmin, handlersSalaEstudiante, handlersSalaProfe, handlersSalaPublico } from './salas/handlers'
import { RolSala } from './validators/auth'

const PORT = (process.env.PORT && parseInt(process.env.PORT)) || 3005

export const io = mount(PORT)

/** Setup de app */
io.use(conErrorLogging)
  .use(conSession)
  // Despachamos los handlers según el rol del usuario:
  .on('connection', async (socket: SocketConSesion) => {
    // Publico: no requiere sesión, pero sí el id de sala para validar que exista y enviar la config pública
    if (isNullish(socket.data) || isNullish(socket.data.session)) {
      await handlersSalaPublico(socket, socket.handshake.auth.idSala)
      await handlersEncuestasOverlay(socket, socket.handshake.auth.idSala)
    }

    // Estudiante: requiere sesión de estudiante válida, y permisos para la sala (chequeados en `conSession`)
    else if (socket.data.session.rol === RolSala.Estudiante) {
      await handlersSalaEstudiante(socket as SocketEstudiante, socket.data.session.idSala)
      await handlersEncuestasEstudiante(socket as SocketEstudiante, socket.data.session.idSala)
    }

    // Profe: requiere sesión de profe válida
    else if (socket.data.session.rol === RolSala.Profe) {
      await handlersSalaProfe(socket as SocketProfe)
      await handlersEncuestasProfe(socket as SocketProfe)
    }

    // Admin: requiere sesión de admin válida
    else if (socket.data.session.rol === RolSala.Admin) {
      await handlersAdmin(socket)
    }
  })
