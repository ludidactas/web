import { afterEach, describe, expect, it, spyOn } from 'bun:test'
import redis from '../../redis'
import { MetodosLogin } from '../../validators/auth'
import {
  borrarSala,
  encolarAsistencia,
  getAsistenciasPendientes,
  getEstudiantes,
  getEventosAsistencia,
  getRegistroDeClase,
  getSala,
  guardarEstudiante,
  guardarRegistroDeClase,
  guardarSala,
  registrarEventoAsistencia,
  salaCodec,
} from '../db'
import { MetodosLogin as Metodo } from '../../validators/auth'
import { WssEstudianteSessionSchema } from '../../validators/session'

const ID = `test-versionado-${crypto.randomUUID()}`

const salaV0 = {
  id: ID,
  profe: { email: 'profe@test.com' },
  config: { nombre_profe: 'Profe', link: 'x', metodo_login: MetodosLogin.Nombre, solo_invitados: false },
}

afterEach(() => redis.hdel('salas', ID))

describe('getSala / guardarSala con versión', () => {
  it('lee una sala guardada antes del versionado (sin `v`)', async () => {
    await redis.hset('salas', ID, JSON.stringify(salaV0))
    const sala = await getSala(ID)
    expect(sala?.id).toBe(ID)
    expect(sala).not.toHaveProperty('v')
  })

  it('guardar marca la versión en redis y getSala devuelve lo mismo', async () => {
    await redis.hset('salas', ID, JSON.stringify(salaV0))
    const sala = (await getSala(ID))!
    await guardarSala(sala)
    expect(JSON.parse((await redis.hget('salas', ID))!).v).toBe(salaCodec.version)
    expect(await getSala(ID)).toEqual(sala)
  })

  it('una sala inexistente da null', async () => {
    expect(await getSala(ID)).toBeNull()
  })

  it('una sala escrita por un server más nuevo falla con un error claro', async () => {
    await redis.hset('salas', ID, JSON.stringify({ ...salaV0, v: salaCodec.version + 1 }))
    await expect(getSala(ID)).rejects.toThrow(/más nueva/)
  })
})

describe('entidades de la sala en redis', () => {
  afterEach(() => borrarSala(ID))

  it('estudiantes: roundtrip y lectura de una sesión guardada sin `v`', async () => {
    const sesion = WssEstudianteSessionSchema.parse({
      rol: 'estudiante',
      idSala: ID,
      metodo: Metodo.Nombre,
      nombre: 'Ana',
    })
    await guardarEstudiante(ID, sesion)
    expect(await getEstudiantes(ID)).toEqual({ Ana: sesion })

    await redis.hset(`sala:${ID}:estudiantes`, 'Ana', JSON.stringify(sesion))
    expect(await getEstudiantes(ID)).toEqual({ Ana: sesion })
  })

  it('estudiantes: un documento ilegible se omite y no tira la planilla', async () => {
    const ana = WssEstudianteSessionSchema.parse({
      rol: 'estudiante',
      idSala: ID,
      metodo: Metodo.Nombre,
      nombre: 'Ana',
    })
    await guardarEstudiante(ID, ana)
    await redis.hset(`sala:${ID}:estudiantes`, 'roto', JSON.stringify({ metodo: 'dni', dni: 'no-es-un-dni' }))
    await redis.hset(`sala:${ID}:estudiantes`, 'basura', 'no es json')
    const warn = spyOn(console, 'warn').mockImplementation(() => {})
    try {
      expect(await getEstudiantes(ID)).toEqual({ Ana: ana })
      expect(warn).toHaveBeenCalledTimes(2)
    } finally {
      warn.mockRestore()
    }
  })

  it('eventos de asistencia: cada elemento de la lista lleva su versión', async () => {
    await registrarEventoAsistencia(ID, 'Ana', 'conexion', 1000)
    await redis.rpush(`sala:${ID}:asistencia`, JSON.stringify({ userId: 'Ana', evento: 'desconexion', ts: 2000 }))
    expect(JSON.parse((await redis.lindex(`sala:${ID}:asistencia`, 0))!).v).toBe(0)
    expect(await getEventosAsistencia(ID)).toEqual([
      { userId: 'Ana', evento: 'conexion', ts: 1000 },
      { userId: 'Ana', evento: 'desconexion', ts: 2000 },
    ])
  })

  it('asistencias pendientes y registro de clase: roundtrip', async () => {
    const asistencia = { inicio: 1, fin: 2, estudiantes: [{ userId: 'Ana', nombre: 'Ana', presente: true }] }
    await encolarAsistencia(ID, asistencia)
    expect(await getAsistenciasPendientes(ID)).toEqual([asistencia])

    await guardarRegistroDeClase(ID, { inicio: 1, fin: null })
    expect(await getRegistroDeClase(ID)).toEqual({ inicio: 1, fin: null })
  })
})
