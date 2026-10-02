import { afterAll, beforeAll, describe, expect, test } from 'bun:test'
import { Server } from 'socket.io'
import { io as ioClient, Socket as SocketCli } from 'socket.io-client'
import { z } from 'zod'
import { comandos, escuchar } from '../../wss-cli/contrato-cli'
import { comando, comandoAck, devuelve, sinPayload } from './definir'
import { registrar } from './registrar'

const contrato = {
  'cosa:borrar': comando(z.object({ id: z.string().min(1, 'Falta el id') })),
  'cosa:sumar': comandoAck(z.object({ a: z.number(), b: z.number().default(10) }), devuelve<number>()),
  'cosa:ping': comandoAck(sinPayload, devuelve<string>()),
  'cosa:falla': comandoAck(sinPayload, devuelve<void>()),
}

interface Eventos {
  'cosa:borrada': { id: string }
}

let server: Server
let cli: SocketCli
const borradas: string[] = []

beforeAll(async () => {
  server = new Server()
  server.on('connection', (socket) => {
    registrar(socket, contrato, {
      'cosa:borrar': async ({ id }) => {
        borradas.push(id)
        socket.emit('cosa:borrada', { id })
      },
      'cosa:sumar': async ({ a, b }) => a + b,
      'cosa:ping': async () => 'pong',
      'cosa:falla': async () => {
        throw new Error('boom')
      },
    })
  })
  server.listen(0)
  const port = (server.httpServer.address() as { port: number }).port
  cli = ioClient(`http://localhost:${port}`, { reconnection: false })
  await new Promise<void>((resolve) => cli.on('connect', () => resolve()))
})

afterAll(() => {
  cli.disconnect()
  server.close()
})

describe('registrar + comandos/escuchar', () => {
  const c = () => comandos<typeof contrato>(cli)

  test('pedir devuelve el dato del ack, con defaults de zod aplicados en el server', async () => {
    expect(await c().pedir('cosa:sumar', { a: 1 })).toBe(11)
    expect(await c().pedir('cosa:sumar', { a: 1, b: 2 })).toBe(3)
  })

  test('comando sin payload', async () => {
    expect(await c().pedir('cosa:ping')).toBe('pong')
  })

  test('pedir rechaza con el mensaje del error del handler', async () => {
    await expect(c().pedir('cosa:falla')).rejects.toThrow('boom')
  })

  test('pedir rechaza con los mensajes de zod, legibles', async () => {
    // @ts-expect-error `a` es obligatorio
    await expect(c().pedir('cosa:sumar', {})).rejects.toThrow('Required')
  })

  test('enviar ejecuta el handler y escuchar recibe lo que el server emite', async () => {
    const recibidas: string[] = []
    const dejar = escuchar<Eventos>(cli, { 'cosa:borrada': ({ id }) => recibidas.push(id) })
    c().enviar('cosa:borrar', { id: 'x1' })
    await Bun.sleep(50)
    expect(borradas).toContain('x1')
    expect(recibidas).toEqual(['x1'])

    dejar()
    c().enviar('cosa:borrar', { id: 'x2' })
    await Bun.sleep(50)
    expect(recibidas).toEqual(['x1'])
  })

  test('enviar con payload inválido notifica por wss:error, sin ack', async () => {
    const error = new Promise<{ message: string }>((resolve) => cli.once('wss:error', resolve))
    c().enviar('cosa:borrar', { id: '' })
    expect((await error).message).toBe('Falta el id')
  })

  // Solo se chequea en compilación (`tsc`): la función no se ejecuta.
  const _chequeosDeTipos = () => {
    // @ts-expect-error 'cosa:sumar' responde por ack: se pide, no se envía
    c().enviar('cosa:sumar', { a: 1 })
    // @ts-expect-error 'cosa:borrar' no responde datos
    c().pedir('cosa:borrar', { id: 'x' })
    // @ts-expect-error evento fuera del contrato
    c().enviar('cosa:inexistente')
  }
})
