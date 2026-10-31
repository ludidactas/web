import { afterEach, describe, expect, it } from 'bun:test'
import { estudianteSala } from '../app'
import { borrarSala } from '../../salas/db'
import type { Encuesta } from '../../validators/polls'
import * as db from '../db'

const idSala = `test-votos-${crypto.randomUUID()}`

function basePoll(overrides: Partial<Encuesta>): Encuesta {
  return {
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
    admiteAportes: false,
    admiteMultiplesVotos: false,
    maxMultiplesVotos: null,
    ...overrides,
  }
}

async function crearPoll(overrides: Partial<Encuesta> = {}): Promise<Encuesta> {
  const poll = basePoll(overrides)
  await db.guardarEncuesta(idSala, poll)
  await db.registarEncuestas(idSala, poll.id)
  return poll
}

afterEach(() => borrarSala(idSala))

describe('votar — votos inflados', () => {
  it('votar 3 veces la misma opción en multi-voto deja el contador en 1 y el set del usuario con 1 elemento', async () => {
    const poll = await crearPoll({ admiteMultiplesVotos: true, maxMultiplesVotos: 2 })
    const estu = await estudianteSala(idSala, 'user-1')

    await estu.votar({ pollId: poll.id, tipo: 'opcion', optionId: '0' })
    await estu.votar({ pollId: poll.id, tipo: 'opcion', optionId: '0' })
    await estu.votar({ pollId: poll.id, tipo: 'opcion', optionId: '0' })

    const votos = await db.getVotos(idSala, poll.id)
    expect(votos['0']).toBe(1)
    const votosUsuario = await db.getVotosUsuario(idSala, poll.id, 'user-1')
    expect(votosUsuario.length).toBe(1)
  })

  it('voto único con dos votar en paralelo: exactamente una promesa se cumple y el contador queda en 1', async () => {
    const poll = await crearPoll()
    const estu = await estudianteSala(idSala, 'user-1')

    const res = await Promise.allSettled([
      estu.votar({ pollId: poll.id, tipo: 'opcion', optionId: '0' }),
      estu.votar({ pollId: poll.id, tipo: 'opcion', optionId: '0' }),
    ])

    const cumplidas = res.filter((r) => r.status === 'fulfilled')
    expect(cumplidas.length).toBe(1)
    const votos = await db.getVotos(idSala, poll.id)
    expect(votos['0']).toBe(1)
  })

  it('un voto legítimo cuenta 1', async () => {
    const poll = await crearPoll()
    await (await estudianteSala(idSala, 'user-1')).votar({ pollId: poll.id, tipo: 'opcion', optionId: '0' })
    const votos = await db.getVotos(idSala, poll.id)
    expect(votos['0']).toBe(1)
  })

  it('dos opciones distintas en multi-voto cuentan 2', async () => {
    const poll = await crearPoll({ admiteMultiplesVotos: true, maxMultiplesVotos: 2 })
    const estu = await estudianteSala(idSala, 'user-1')
    await estu.votar({ pollId: poll.id, tipo: 'opcion', optionId: '0' })
    await estu.votar({ pollId: poll.id, tipo: 'opcion', optionId: '1' })
    const votos = await db.getVotos(idSala, poll.id)
    expect(votos['0']).toBe(1)
    expect(votos['1']).toBe(1)
  })

  it('votar opciones distintas hasta maxMultiplesVotos y una más tira el error de máximo', async () => {
    const poll = await crearPoll({ admiteMultiplesVotos: true, maxMultiplesVotos: 2 })
    const estu = await estudianteSala(idSala, 'user-1')
    await estu.votar({ pollId: poll.id, tipo: 'opcion', optionId: '0' })
    await estu.votar({ pollId: poll.id, tipo: 'opcion', optionId: '1' })
    await expect(
      estu.votar({ pollId: poll.id, tipo: 'opcion', optionId: '0' })
    ).rejects.toThrow(/Ya emitiste el máximo de 2 votos permitidos/)
  })
})
