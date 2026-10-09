import { conectar } from './conexion'
import { protegido } from './contrato/registrar'
import { conErrorLogging } from './middleware/error-handling'
import { conSession, SocketConSesion } from './middleware/session'
import { io } from './io'
import { mount } from './mount'

const PORT = (process.env.PORT && parseInt(process.env.PORT)) || 3005

mount(PORT)

/** Setup de app. Lo que falle al armar la conexión se notifica por `wss:error`, no tira el proceso. */
io.use(conErrorLogging)
  .use(conSession)
  .on('connection', (socket: SocketConSesion) => protegido(socket, () => conectar(socket)))
