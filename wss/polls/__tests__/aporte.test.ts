import { afterEach, describe, expect, it } from 'bun:test'
import { estudianteSala, profeSala } from '../app'
import { borrarSala } from '../../salas/db'
import type { Encuesta } from '../../validators/polls'
import * as db from '../db'

const idSala = `test-aporte-${crypto.randomUUID()}`

async function crearPollConAportes(admiteMultiplesVotos = true): Promise<Encuesta> {
  const poll: Encuesta = {
    id: Date.now().toString() + Math.random().toString(36).slice(2),
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
    admiteAportes: true,
    admiteMultiplesVotos,
    maxMultiplesVotos: null,
  }
  await db.guardarEncuesta(idSala, poll)
  await db.registarEncuestas(idSala, poll.id)
  return poll
}

afterEach(() => borrarSala(idSala))

describe('votar — carrera de aportes', () => {
  it('5 aportes concurrentes de usuarios distintos terminan con 7 opciones sin pisarse', async () => {
    const poll = await crearPollConAportes()

    const aportes = [
      'aporte-1',
      'aporte-2',
      'aporte-3',
      'aporte-4',
      'aporte-5',
    ]

    await Promise.all(
      aportes.map((aporte, i) =>
        estudianteSala(idSala, `user-${i}`).then((estu) =>
          estu.votar({ pollId: poll.id, tipo: 'aporte', aporte })
        )
      )
    )

    const encuesta = (await db.getEncuesta(idSala, poll.id))!
    expect(encuesta.opciones.length).toBe(7)
    expect(encuesta.opciones.map((o) => o.id)).toEqual(['0', '1', '2', '3', '4', '5', '6'])
    const leida = await db.getEncuestas(idSala)
    expect(leida.find((p) => p.id === poll.id)!.opciones.length).toBe(7)
  })

  it('un aporte válido entra y cuenta 1 voto para su nueva opción', async () => {
    const poll = await crearPollConAportes()
    const estu = await estudianteSala(idSala, 'user-1')

    const res = await estu.votar({ pollId: poll.id, tipo: 'aporte', aporte: 'nueva opción' })

    expect(res.opciones.length).toBe(3)
    const votos = await db.getVotos(idSala, poll.id)
    expect(votos['2']).toBe(1)
  })
})

describe('votar — aporte en voto único', () => {
  it('el mismo usuario aporta dos veces: la primera pasa y la segunda tira Ya votaste', async () => {
    const poll = await crearPollConAportes(false)
    const estu = await estudianteSala(idSala, 'user-1')

    await estu.votar({ pollId: poll.id, tipo: 'aporte', aporte: 'aporte-uno' })

    await expect(
      estu.votar({ pollId: poll.id, tipo: 'aporte', aporte: 'aporte-dos' })
    ).rejects.toThrow('Ya votaste en esta encuesta')

    const encuesta = (await db.getEncuesta(idSala, poll.id))!
    expect(encuesta.opciones.length).toBe(3)
  })

  it('dos aportes en paralelo del mismo usuario: exactamente una promesa cumple y gana UNA opción', async () => {
    const poll = await crearPollConAportes(false)
    const estu = await estudianteSala(idSala, 'user-1')

    const res = await Promise.allSettled([
      estu.votar({ pollId: poll.id, tipo: 'aporte', aporte: 'aporte-uno' }),
      estu.votar({ pollId: poll.id, tipo: 'aporte', aporte: 'aporte-dos' }),
    ])

    const cumplidas = res.filter((r) => r.status === 'fulfilled')
    expect(cumplidas.length).toBe(1)
    const encuesta = (await db.getEncuesta(idSala, poll.id))!
    expect(encuesta.opciones.length).toBe(3)
  })

  it('después de un aporte en voto único, el usuario figura en getVotantes', async () => {
    const poll = await crearPollConAportes(false)
    const estu = await estudianteSala(idSala, 'user-1')

    await estu.votar({ pollId: poll.id, tipo: 'aporte', aporte: 'aporte-uno' })

    const votantes = await db.getVotantes(idSala, poll.id)
    expect(votantes).toContain('user-1')
  })

  it('otro usuario distinto puede aportar su opción', async () => {
    const poll = await crearPollConAportes(false)

    await (await estudianteSala(idSala, 'user-1')).votar({ pollId: poll.id, tipo: 'aporte', aporte: 'aporte-uno' })
    const res = await (await estudianteSala(idSala, 'user-2')).votar({ pollId: poll.id, tipo: 'aporte', aporte: 'aporte-dos' })

    expect(res.opciones.length).toBe(4)
  })
})

describe('votar — carrera de aporte contra poll:close', () => {
  it('un aporte concurrente con el cierre no reabre la encuesta', async () => {
    const poll = await crearPollConAportes()
    const [estu, profe] = await Promise.all([estudianteSala(idSala, 'user-cierre'), profeSala(idSala)])

    await Promise.allSettled([
      estu.votar({ pollId: poll.id, tipo: 'aporte', aporte: 'aporte-en-vuelo' }),
      profe.updatePoll(poll.id, { isOpen: false }),
    ])

    const encuesta = (await db.getEncuesta(idSala, poll.id))!
    expect(encuesta.isOpen).toBe(false)
  })
})
