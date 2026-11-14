import { afterEach, describe, expect, it } from 'bun:test'
import redis from '../../redis'
import { Salas } from '../app'
import { MetodosLogin } from '../../validators/auth'
import type { SocketProfe } from '../../middleware/roles'

const email = `crear-${crypto.randomUUID()}@test.com`
const creadas: string[] = []
const socket = { data: { session: { email, nombre: 'Profe' } } } as unknown as SocketProfe

afterEach(async () => {
  for (const id of creadas.splice(0)) await Salas.eliminar(email, id)
})

describe('Salas.crear', () => {
  it('la sala nueva nace con la marca de ids por sala', async () => {
    const sala = await Salas.crear(socket, { nombre: 'Sala', metodo_login: MetodosLogin.Nombre, solo_invitados: false })
    creadas.push(sala.id)

    expect(await redis.exists(`sala:${sala.id}:migrado_ids`)).toBe(1)
  })
})
