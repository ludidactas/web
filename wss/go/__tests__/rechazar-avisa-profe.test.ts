import { afterAll, afterEach, beforeAll, describe, expect, it } from 'bun:test'
import { createServer, type Server as HttpServer } from 'http'
import type { AddressInfo } from 'net'
import type { Socket } from 'socket.io'
import { io as ioClient, type Socket as SocketCli } from 'socket.io-client'
import { idOpaco } from '../../id-opaco'
import { io } from '../../io'
import { rooms } from '../../rooms'
import { borrarSala, guardarSala } from '../../salas/db'
import { MetodosLogin, RolSala } from '../../validators/auth'
import { EstadoPartida, type Partida } from '../../validators/go'
import { CONFIG_DEFAULTS } from '../../validators/overlay'
import type { SalaData } from '../../validators/salas'
import { estudianteGo } from '../app'
import { guardarPartida, registrarPartida, setPartidaActiva } from '../db'

const salaId = `test-rechazo-profe-${crypto.randomUUID()}`
const profeEmail = `profe-${salaId}@test.com`
const userIdProfe = idOpaco(salaId, profeEmail)
const userIdEstudiante = `estudiante-${crypto.randomUUID()}`

let httpServer: HttpServer
let cliente: SocketCli

const unirAlRoomDelProfe = (socket: Socket) => {
  socket.data.session = { rol: RolSala.Profe, userId: profeEmail }
  socket.join([rooms.profe(salaId), rooms.usuario(salaId, profeEmail)])
}

function salaData(id: string): SalaData {
  return {
    id,
    profe: { email: profeEmail },
    config: {
      nombre_profe: 'Profe',
      link: 'x',
      metodo_login: MetodosLogin.Nombre,
      solo_invitados: false,
      overlay: CONFIG_DEFAULTS,
    },
  }
}

function partidaPendiente(negroUserId: string, blancoUserId: string): Partida {
  return {
    id: crypto.randomUUID(),
    salaId,
    tamaño: 9,
    modo: 'partida',
    negro: { userId: negroUserId, nombre: 'Profe' },
    blanco: { userId: blancoUserId, nombre: 'Estudiante' },
    tablero: Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => '.')),
    turno: 'N',
    capturasNegras: 0,
    capturasBlancas: 0,
    pases: 0,
    historial: [],
    ultimaJugada: null,
    removidas: null,
    vivo: null,
    confirmaron: { negro: false, blanco: false },
    estado: EstadoPartida.Pendiente,
    resultado: null,
    motivoFin: null,
    ganadorUserId: null,
    creadaEn: new Date().toISOString(),
  }
}

async function armarInvitacionDelProfe() {
  await guardarSala(salaData(salaId))
  const partida = partidaPendiente(userIdProfe, userIdEstudiante)
  await guardarPartida(partida)
  await registrarPartida(salaId, partida.id)
  await setPartidaActiva(salaId, userIdProfe, partida.id)
  await setPartidaActiva(salaId, userIdEstudiante, partida.id)
  return partida
}

beforeAll(async () => {
  httpServer = createServer()
  io.attach(httpServer)
  io.on('connection', unirAlRoomDelProfe)
  httpServer.listen(0)
  const puerto = (httpServer.address() as AddressInfo).port
  cliente = ioClient(`http://localhost:${puerto}`, { reconnection: false })
  await new Promise<void>((resolve) => cliente.on('connect', () => resolve()))
})

afterEach(async () => {
  await borrarSala(salaId)
})

afterAll(() => {
  cliente.disconnect()
  io.off('connection', unirAlRoomDelProfe)
  httpServer.close()
})

describe('rechazar una invitación de Go creada por el profe', () => {
  it('le llega go:invitacion_rechazada al profe', async () => {
    const partida = await armarInvitacionDelProfe()
    const recibida = new Promise<{ partidaId: string }>((resolve) =>
      cliente.once('go:invitacion_rechazada', resolve)
    )

    await (await estudianteGo(salaId, userIdEstudiante)).rechazar({ partidaId: partida.id })

    expect(await recibida).toEqual({ partidaId: partida.id })
  })
})
