import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import { createServer, type Server as HttpServer } from 'http'
import type { AddressInfo } from 'net'
import type { Socket } from 'socket.io'
import { io as ioClient, type Socket as SocketCli } from 'socket.io-client'
import { idOpaco } from '../../id-opaco'
import { io } from '../../io'
import type { SocketEstudiante, SocketProfe } from '../../middleware/roles'
import { borrarSala, guardarSala } from '../../salas/db'
import { MetodosLogin, RolSala } from '../../validators/auth'
import { CONFIG_DEFAULTS } from '../../validators/overlay'
import { handlersGoEstudiante, handlersGoProfe } from '../handlers'

const salaId = `test-go-identidad-${crypto.randomUUID()}`
const profeEmail = `profe-${salaId}@test.com`
const idEstudiante = 'a1b2c3d4e5f60718'

let httpServer: HttpServer
let puerto = 0
const clientes: SocketCli[] = []

const registrarGo = async (socket: Socket) => {
  if (socket.handshake.auth.rol === RolSala.Profe) {
    socket.data.session = { rol: RolSala.Profe, userId: profeEmail, email: profeEmail, nombre: 'Profe' }
    await handlersGoProfe(socket as SocketProfe, salaId)
  } else {
    socket.data.session = { rol: RolSala.Estudiante, userId: idEstudiante, nombre: 'Ana' }
    await handlersGoEstudiante(socket as SocketEstudiante, salaId)
  }
  socket.emit('listo')
}

/** Conecta y devuelve el socket recién cuando el server ya registró sus comandos de Go. */
async function conectar(rol: RolSala): Promise<SocketCli> {
  const cliente = ioClient(`http://localhost:${puerto}`, { reconnection: false, auth: { rol } })
  clientes.push(cliente)
  await new Promise<void>((resolve) => cliente.once('listo', () => resolve()))
  return cliente
}

beforeAll(async () => {
  await guardarSala({
    id: salaId,
    profe: { email: profeEmail },
    config: { nombre_profe: 'Profe', link: 'x', metodo_login: MetodosLogin.Nombre, solo_invitados: false, overlay: CONFIG_DEFAULTS },
  })
  httpServer = createServer()
  io.attach(httpServer)
  io.on('connection', registrarGo)
  httpServer.listen(0)
  puerto = (httpServer.address() as AddressInfo).port
})

afterAll(async () => {
  clientes.forEach((c) => c.disconnect())
  await new Promise((resolve) => setTimeout(resolve, 100))
  io.off('connection', registrarGo)
  httpServer.close()
  await borrarSala(salaId)
})

describe('go:identidad', () => {
  it('el estudiante lo pide con la conexión ya abierta y recibe el id de su sesión', async () => {
    const cliente = await conectar(RolSala.Estudiante)

    expect(await cliente.emitWithAck('go:identidad')).toEqual({ ok: true, data: { id: idEstudiante } })
  })

  it('el profe recibe su id por sala, no su email', async () => {
    const cliente = await conectar(RolSala.Profe)

    const respuesta = await cliente.emitWithAck('go:identidad')

    expect(respuesta).toEqual({ ok: true, data: { id: await idOpaco(salaId, profeEmail) } })
    expect(JSON.stringify(respuesta)).not.toContain(profeEmail)
  })
})
