import { afterEach, describe, expect, it } from 'bun:test'
import { estudianteSala } from '../app'
import { borrarSala } from '../../salas/db'
import type { Encuesta } from '../../validators/polls'
import * as db from '../db'

const idSala = `test-aporte-${crypto.randomUUID()}`

async function crearPollConAportes(): Promise<Encuesta> {
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
    admiteMultiplesVotos: true,
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
