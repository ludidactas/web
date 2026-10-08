import { afterAll, beforeAll, expect, test } from 'bun:test'
import { io as clienteIo } from 'socket.io-client'

// El server arranca al importarse: en su propio puerto para no pisar uno de desarrollo.
const PUERTO = 3917
process.env.PORT = String(PUERTO)
// Solo el login de profe/admin las usa; el server las exige al arrancar.
process.env.NEXTAUTH_SECRET ??= 'secreto-de-test'
process.env.POLLS_ADMINS ??= 'admin@test.com'

const redis = (await import('../wss/redis')).default
const { guardarSala, borrarSala } = await import('../wss/salas/db')
const { io: servidor } = await import('../wss/server')

const ID_SALA = 'registro-temprano'

beforeAll(async () => {
  await guardarSala({
    id: ID_SALA,
    profe: { email: 'registro-temprano@test.com' },
    config: { nombre: 'x', metodo_login: 'nombre', solo_invitados: false, nombre_profe: 'x', link: 'l', overlay: {} },
  } as never)
})

afterAll(async () => {
  await Bun.sleep(300) // deja terminar los `disconnect` del server, que consultan la sala
  await borrarSala(ID_SALA)
  servidor.close()
  await redis.quit()
})

// Un comando emitido apenas conecta (como `go:mi_partida` al montar el cliente de Go) tiene que
// encontrar su handler registrado: el server registra todos los grupos antes de correr sus init.
test('un comando emitido apenas conecta no se pierde', async () => {
  const sinRespuesta = await Promise.all(
    Array.from({ length: 20 }, async (_, i) => {
      const socket = clienteIo(`http://localhost:${PUERTO}`, {
        auth: { rol: 'estudiante', idSala: ID_SALA, nombre: `Alumno ${i}`, clientId: `c${i}` },
        reconnection: false,
      })
      await new Promise<void>((resolver) => socket.on('connect', () => resolver()))
      const respuesta = await socket.timeout(1500).emitWithAck('go:mi_partida').catch(() => null)
      socket.disconnect()
      return respuesta === null
    })
  )

  expect(sinRespuesta.filter(Boolean)).toHaveLength(0)
})
