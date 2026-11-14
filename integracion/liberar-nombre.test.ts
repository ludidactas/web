import { afterAll, afterEach, describe, expect, it } from 'bun:test'
import redis from '../wss/redis'
import * as db from '../wss/salas/db'
import * as dbPolls from '../wss/polls/db'
import * as dbGo from '../wss/go/db'
import { borrarVotosDeUsuario, estudianteSala } from '../wss/polls/app'
import { borrarDatosGoDeUsuario } from '../wss/go/app'
import { MetodosLogin, RolSala } from '../wss/validators/auth'
import { WssEstudianteSessionSchema } from '../wss/validators/session'
import type { Encuesta } from '../wss/validators/polls'
import type { Sala } from '../wss/salas/app'

// Piezas de `sala:liberar_nombre` contra redis real: quitar la reserva y borrar lo asociado al nombre.

const idSala = `liberar-${crypto.randomUUID().split('-')[0]}`
const salaFalsa = { id: idSala, broadcastPorRol: async () => {} } as unknown as Sala

const estudiante = (nombre: string, clientId?: string) =>
  WssEstudianteSessionSchema.parse({ rol: RolSala.Estudiante, idSala, metodo: MetodosLogin.Nombre, nombre, clientId })

afterEach(() => db.borrarSala(idSala))
afterAll(() => redis.quit())

describe('reserva del nombre', () => {
  it('liberar quita el clientId y conserva el resto de la fila', async () => {
    await db.guardarEstudiante(idSala, estudiante('Ana', 'c1'))
    await db.guardarEstudiante(idSala, estudiante('Beto', 'c2'))

    await db.liberarReservaEstudiante(idSala, 'Ana')

    const planilla = await db.getEstudiantes(idSala)
    expect(planilla['Ana']).toMatchObject({ userId: 'Ana', nombre: 'Ana' })
    expect(planilla['Ana'].clientId).toBeUndefined()
    expect(planilla['Beto'].clientId).toBe('c2')
  })

  it('liberar un nombre sin fila no crea nada', async () => {
    await db.liberarReservaEstudiante(idSala, 'Nadie')
    expect(await db.getEstudiantes(idSala)).toEqual({})
  })
})

describe('borrar datos', () => {
  it('quita la fila de la planilla y solo los eventos de asistencia de ese userId', async () => {
    await db.guardarEstudiante(idSala, estudiante('Ana'))
    await db.guardarEstudiante(idSala, estudiante('Beto'))
    await db.registrarEventoAsistencia(idSala, 'Ana', 'conexion', 1)
    await db.registrarEventoAsistencia(idSala, 'Beto', 'conexion', 2)
    await db.registrarEventoAsistencia(idSala, 'Ana', 'desconexion', 3)

    await db.borrarEstudiante(idSala, 'Ana')
    await db.borrarEventosAsistenciaDe(idSala, 'Ana')

    expect(Object.keys(await db.getEstudiantes(idSala))).toEqual(['Beto'])
    expect(await db.getEventosAsistencia(idSala)).toEqual([{ userId: 'Beto', evento: 'conexion', ts: 2 }])
  })

  it('los votos de encuestas se descuentan de los conteos y de los votantes', async () => {
    const poll: Encuesta = {
      id: 'p1',
      pregunta: '¿Cuál?',
      opciones: [
        { id: '0', texto: 'A' },
        { id: '1', texto: 'B' },
      ],
      createdAt: new Date().toISOString(),
      isOpen: true,
      isPublished: true,
      isFocused: false,
      isRevealed: false,
      admiteAportes: false,
      admiteMultiplesVotos: false,
      maxMultiplesVotos: null,
    }
    await dbPolls.guardarEncuesta(idSala, poll)
    await dbPolls.registarEncuestas(idSala, poll.id)
    await (await estudianteSala(idSala, 'Ana')).votar({ pollId: poll.id, tipo: 'opcion', optionId: '0' })
    await (await estudianteSala(idSala, 'Beto')).votar({ pollId: poll.id, tipo: 'opcion', optionId: '0' })

    await borrarVotosDeUsuario(salaFalsa, 'Ana')

    expect((await dbPolls.getVotos(idSala, poll.id))['0']).toBe(1)
    expect(await dbPolls.getVotantes(idSala, poll.id)).toEqual(['Beto'])
    expect(await dbPolls.getVotantesOpcion(idSala, poll.id, '0')).toEqual(['Beto'])
    expect(await dbPolls.getVotosUsuario(idSala, poll.id, 'Ana')).toEqual([])
  })

  it('Go: borra las estadísticas del usuario', async () => {
    await dbGo.incrementarStats(idSala, 'Ana', true)
    await dbGo.incrementarStats(idSala, 'Beto', false)

    await borrarDatosGoDeUsuario(idSala, 'Ana')

    expect(await redis.exists(`sala:${idSala}:go:stats:Ana`)).toBe(0)
    expect(await redis.exists(`sala:${idSala}:go:stats:Beto`)).toBe(1)
  })
})
