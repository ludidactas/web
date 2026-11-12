import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import { io as ioCliente, type Socket as SocketCli } from 'socket.io-client'
import { io } from '../wss/io'
import { rooms } from '../wss/rooms'
import redis from '../wss/redis'
import { Salas } from '../wss/salas/app'
import * as db from '../wss/salas/db'
import { CONFIG_DEFAULTS } from '../wss/validators/overlay'
import { AccesoSala, MetodosLogin, RolSala } from '../wss/validators/auth'

// El server real de socket.io (en un puerto libre) con estudiantes conectados de verdad: al sacar a alguien
// de la lista, `sanitizar` lo expulsa en las salas `lista` y no toca a nadie en `invitados`.

let puerto: number
const salasCreadas: string[] = []
const clientes: SocketCli[] = []

beforeAll(() => {
  io.on('connection', (socket) => {
    const { idSala, userId } = socket.handshake.auth
    socket.data.session = { rol: RolSala.Estudiante, userId, idSala, metodo: MetodosLogin.DNI, dni: userId }
    socket.join(rooms.estudiantes(idSala))
  })
  io.listen(0)
  puerto = (io.httpServer as unknown as { address(): { port: number } }).address().port
})

afterAll(async () => {
  clientes.forEach((c) => c.disconnect())
  for (const id of salasCreadas) await db.borrarSala(id)
  await io.close()
  await redis.quit()
})

async function salaCon(acceso: AccesoSala, lista: string[]) {
  const id = `kick-${crypto.randomUUID().split('-')[0]}`
  salasCreadas.push(id)
  await db.guardarSala({
    id,
    profe: { email: 'profe@test.com' },
    config: { nombre_profe: 'P', link: 'x', metodo_login: MetodosLogin.DNI, acceso, overlay: CONFIG_DEFAULTS },
  })
  const sala = await Salas.get(id)
  await sala.listaPermitidos().agregar(lista)
  return sala
}

type Estudiante = { dni: string; kick?: { motivo: string }; desconectado: Promise<void> }

async function conectar(idSala: string, dni: string): Promise<Estudiante> {
  const cli = ioCliente(`http://localhost:${puerto}`, { auth: { idSala, userId: dni }, reconnection: false })
  clientes.push(cli)
  const est: Estudiante = { dni, desconectado: new Promise((r) => cli.on('disconnect', () => r())) }
  cli.on('sala:kick', (payload) => (est.kick = payload))
  await new Promise<void>((resolve) => cli.on('connect', () => resolve()))
  return est
}

/** Da tiempo a que lleguen kick y desconexión (ya enviados por el server) o confirma que no hubo. */
const esperar = (ms = 150) => new Promise((r) => setTimeout(r, ms))

describe('sanitizar al editar la lista', () => {
  it('lista: remover expulsa a quien se quitó, con el motivo, y no a los demás', async () => {
    const sala = await salaCon(AccesoSala.Lista, ['111', '222'])
    const [a, b] = await Promise.all([conectar(sala.id, '111'), conectar(sala.id, '222')])

    await sala.listaPermitidos().remover(['222'])
    await sala.sanitizar()
    await Promise.race([b.desconectado, esperar(1000)])
    await esperar()

    expect(b.kick?.motivo).toMatch(/DNI/)
    expect(a.kick).toBeUndefined()
  })

  it('lista: limpiar expulsa a todos', async () => {
    const sala = await salaCon(AccesoSala.Lista, ['111', '222'])
    const estudiantes = await Promise.all([conectar(sala.id, '111'), conectar(sala.id, '222')])

    await sala.listaPermitidos().limpiar()
    await sala.sanitizar()
    await esperar()

    expect(estudiantes.every((e) => e.kick)).toBe(true)
  })

  it('invitados: quitar a alguien de la lista no expulsa a nadie', async () => {
    const sala = await salaCon(AccesoSala.Invitados, ['111', '222'])
    const estudiantes = await Promise.all([conectar(sala.id, '111'), conectar(sala.id, '222')])

    await sala.listaPermitidos().remover(['222'])
    await sala.sanitizar()
    await esperar()

    expect(estudiantes.every((e) => e.kick === undefined)).toBe(true)
  })
})
