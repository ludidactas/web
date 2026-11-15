import { afterEach, describe, expect, it } from 'bun:test'
import redis from '../../redis'
import { Salas } from '../app'
import { getEmailProfe, getIdsSalasDeProfe, getSala, getUltimaActividad, guardarEstudiante, marcarActividad } from '../db'
import { barrerSalasInactivas, RETENCION_DIAS } from '../retencion'
import { AccesoSala, MetodosLogin, RolSala } from '../../validators/auth'
import { WssEstudianteSessionSchema } from '../../validators/session'
import type { SocketProfe } from '../../middleware/roles'

const DIA_MS = 24 * 60 * 60_000
const AHORA = Date.now()
const email = `retencion-${crypto.randomUUID()}@test.com`
const creadas: string[] = []

async function crearSala() {
  const socket = { data: { session: { email, nombre: 'Profe' } } } as unknown as SocketProfe
  const sala = await Salas.crear(socket, { nombre: 'Sala', metodo_login: MetodosLogin.Nombre, acceso: AccesoSala.Libre })
  creadas.push(sala.id)
  return sala.id
}

afterEach(async () => {
  for (const id of creadas.splice(0)) await Salas.eliminar(email, id)
})

describe('barrerSalasInactivas', () => {
  it('borra la sala con más de 365 días sin uso, con todo lo suyo', async () => {
    const id = await crearSala()
    await guardarEstudiante(id, WssEstudianteSessionSchema.parse({ rol: RolSala.Estudiante, idSala: id, metodo: MetodosLogin.Nombre, nombre: 'Ana', userId: 'u1' }))
    await marcarActividad(id, AHORA - (RETENCION_DIAS + 1) * DIA_MS)

    await barrerSalasInactivas(AHORA)

    expect(await getSala(id)).toBeNull()
    expect(await getEmailProfe(id)).toBeNull()
    expect(await redis.keys(`sala:${id}:*`)).toEqual([])
    expect(await getIdsSalasDeProfe(email)).not.toContain(id)
  })

  it('no toca la sala con 364 días sin uso', async () => {
    const id = await crearSala()
    await marcarActividad(id, AHORA - (RETENCION_DIAS - 1) * DIA_MS)

    await barrerSalasInactivas(AHORA)

    expect(await getSala(id)).not.toBeNull()
    expect(await getIdsSalasDeProfe(email)).toContain(id)
  })

  it('marca la sala sin fecha y no la borra', async () => {
    const id = await crearSala()
    await redis.del(`sala:${id}:ultima_actividad`)

    await barrerSalasInactivas(AHORA)

    expect(await getSala(id)).not.toBeNull()
    expect(await getUltimaActividad(id)).toBe(AHORA)
  })
})

describe('sala sin dueño', () => {
  it('se borra igual al vencer', async () => {
    const id = await crearSala()
    await redis.hdel('salas_owners', id)
    await marcarActividad(id, AHORA - (RETENCION_DIAS + 1) * DIA_MS)

    await barrerSalasInactivas(AHORA)

    expect(await getSala(id)).toBeNull()
    expect(await redis.keys(`sala:${id}:*`)).toEqual([])
  })
})

describe('última actividad', () => {
  it('se marca al crear la sala y al ingresar un estudiante', async () => {
    const id = await crearSala()
    expect(await getUltimaActividad(id)).toBeGreaterThan(0)

    await marcarActividad(id, 1)
    const sala = await Salas.get(id)
    await sala.registrarIngreso(WssEstudianteSessionSchema.parse({ rol: RolSala.Estudiante, idSala: id, metodo: MetodosLogin.Nombre, nombre: 'Ana', userId: 'u1' }))
    expect(await getUltimaActividad(id)).toBeGreaterThan(1)
  })
})
