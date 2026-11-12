import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import { createServer, type Server as HttpServer } from 'http'
import type { AddressInfo } from 'net'
import type { Socket } from 'socket.io'
import { io as ioClient, type Socket as SocketCli } from 'socket.io-client'
import { avisarContrincantesActualizados, estudianteGo } from '../wss/go/app'
import { idOpaco } from '../wss/id-opaco'
import { io } from '../wss/io'
import { conSession } from '../wss/middleware/session'
import { rooms } from '../wss/rooms'
import { Salas } from '../wss/salas/app'
import { borrarSala, guardarSala } from '../wss/salas/db'
import { MetodosLogin, RolSala } from '../wss/validators/auth'
import type { ContrincanteGo } from '../wss/validators/go'
import { CONFIG_DEFAULTS } from '../wss/validators/overlay'
import type { SalaData } from '../wss/validators/salas'
import type { WssEstudianteSession, WssServerSession } from '../wss/validators/session'

const salaId = `test-go-contrincantes-${crypto.randomUUID()}`
const emailProfe = `profe-${salaId}@test.com`
const nombreProfe = 'Aurelia Quintanilla'
const alumnos = [
  { dni: '20333444555', nombre: 'Zoilo Quispe' },
  { dni: '27111222333', nombre: 'Bernabé Cárdenas' },
]

const sala: SalaData = {
  id: salaId,
  profe: { email: emailProfe, nombre: nombreProfe },
  config: {
    nombre_profe: nombreProfe,
    link: 'x',
    metodo_login: MetodosLogin.DNI,
    solo_invitados: false,
    overlay: CONFIG_DEFAULTS,
  },
}

const sesiones: Record<string, WssServerSession> = {}
let httpServer: HttpServer
let puerto: number
const clientes: SocketCli[] = []

async function entrar({ dni, nombre }: (typeof alumnos)[number]) {
  const socket = {
    handshake: {
      auth: { rol: RolSala.Estudiante, idSala: salaId, dni, nombre },
      headers: {},
      address: '127.0.0.1',
    },
    data: {},
    emit: () => true,
  } as unknown as Socket
  const error = await new Promise<Error | undefined>((resolve) => conSession(socket, (err) => resolve(err)))
  expect(error).toBeUndefined()
  return socket.data.session as WssEstudianteSession
}

function unirSegunClave(socket: Socket) {
  const session = sesiones[socket.handshake.auth.clave]
  socket.data.session = session
  if (session.rol === RolSala.Profe) socket.join([rooms.sala(salaId), rooms.profe(salaId)])
  else socket.join([rooms.sala(salaId), rooms.estudiantes(salaId), rooms.usuario(salaId, session.userId)])
}

async function conectar(clave: string) {
  const cliente = ioClient(`http://localhost:${puerto}`, { reconnection: false, auth: { clave } })
  clientes.push(cliente)
  await new Promise<void>((resolve) => cliente.on('connect', () => resolve()))
  return cliente
}

let ids: string[]
let idProfe: string
let estudiante: SocketCli

beforeAll(async () => {
  await guardarSala(sala)
  const sesionesEstudiantes = await Promise.all(alumnos.map(entrar))
  ids = sesionesEstudiantes.map((s) => s.userId)
  idProfe = await idOpaco(salaId, emailProfe)

  sesionesEstudiantes.forEach((s, i) => (sesiones[`e${i}`] = s))
  sesiones.profe = { rol: RolSala.Profe, email: emailProfe, nombre: nombreProfe, userId: emailProfe }
  const s = await Salas.get(salaId)
  for (const session of sesionesEstudiantes) await s.registrarIngreso(session)

  httpServer = createServer()
  io.attach(httpServer)
  io.on('connection', unirSegunClave)
  httpServer.listen(0)
  puerto = (httpServer.address() as AddressInfo).port

  await conectar('profe')
  estudiante = await conectar('e0')
  await conectar('e1')
})

afterAll(async () => {
  clientes.forEach((c) => c.disconnect())
  io.off('connection', unirSegunClave)
  httpServer.close()
  await borrarSala(salaId)
})

function verificarLista(lista: ContrincanteGo[]) {
  const serializada = JSON.stringify(lista)
  expect(serializada).not.toContain(alumnos[1].dni)
  expect(serializada).not.toContain(emailProfe)

  expect(lista.map((c) => c.id).sort()).toEqual([ids[1], idProfe].sort())
  expect(lista.find((c) => c.id === idProfe)?.nombre).toBe(nombreProfe)
  expect(lista.find((c) => c.id === ids[1])?.nombre).toBe(alumnos[1].nombre)
}

describe('contrincantes de Go de un estudiante', () => {
  it('la lista pedida identifica al profe y al compañero por id opaco, sin DNI ni email', async () => {
    verificarLista(await (await estudianteGo(salaId, ids[0])).contrincantesDisponibles())
  })

  it('la lista que se le empuja al avisar un cambio tampoco lleva DNI ni email', async () => {
    const recibida = new Promise<ContrincanteGo[]>((resolve) =>
      estudiante.once('go:contrincantes_actualizados', resolve)
    )

    await avisarContrincantesActualizados(salaId)

    verificarLista(await recibida)
  })
})
