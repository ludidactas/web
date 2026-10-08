import { isNullish } from 'remeda'
import { conErrorLogging } from './middleware/error-handling'
import { SocketEstudiante, SocketProfe } from './middleware/roles'
import { conSession, SocketConSesion } from './middleware/session'
import { mount } from './mount'
import { handlersGoEstudiante } from './go/handlers'
import { handlersDojo } from './dojo/handlers'
import { handlersEncuestasEstudiante, handlersEncuestasOverlay } from './polls/handlers'
import { handlersAdmin, handlersGestionSalasProfe, handlersSalaEstudiante, handlersSalaPublico } from './salas/handlers'
import { RolSala } from './validators/auth'

const PORT = (process.env.PORT && parseInt(process.env.PORT)) || 3005

export const io = mount(PORT)

/** Setup de app */
io.use(conErrorLogging)
  .use(conSession)
  // Despachamos los handlers según el rol del usuario:
  .on('connection', async (socket: SocketConSesion) => {
    // Dojo: visitante anónimo del dojo de Go, sin sesión ni sala. Registra sus listeners de forma
    // síncrona (sin `await` antes) para no perder los comandos que el cliente bufferea al reconectar.
    if (socket.handshake.auth.rol === RolSala.Dojo) {
      handlersDojo(socket)
    }

    // Publico: no requiere sesión, pero sí el id de sala para validar que exista y enviar la config pública
    else if (isNullish(socket.data) || isNullish(socket.data.session)) {
      await handlersSalaPublico(socket, socket.handshake.auth.idSala)
      await handlersEncuestasOverlay(socket, socket.handshake.auth.idSala)
    }

    // Estudiante: requiere sesión de estudiante válida, y permisos para la sala (chequeados en `conSession`)
    else if (socket.data.session.rol === RolSala.Estudiante) {
      // Primero se registran los comandos de todos los grupos y recién después corren sus init (I/O): un
      // comando que el cliente emite apenas conecta no se pierde (ver docs/contrato-wss.md).
      const { idSala } = socket.data.session
      const iniciar = [
        await handlersSalaEstudiante(socket as SocketEstudiante, idSala),
        await handlersEncuestasEstudiante(socket as SocketEstudiante, idSala),
        await handlersGoEstudiante(socket as SocketEstudiante, idSala),
      ]
      for (const init of iniciar) await init()
    }

    // Profe: requiere sesión de profe válida. Los handlers de operación (incluidas encuestas) se
    // cablean recién al abrir una sala, dentro de `handlersGestionSalasProfe` → `handlersSalaActivaProfe`.
    else if (socket.data.session.rol === RolSala.Profe) {
      await handlersGestionSalasProfe(socket as SocketProfe)
    }

    // Admin: requiere sesión de admin válida
    else if (socket.data.session.rol === RolSala.Admin) {
      await handlersAdmin(socket)
    }
  })
