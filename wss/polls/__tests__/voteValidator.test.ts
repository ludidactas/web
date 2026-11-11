import { describe, expect, it } from 'bun:test'
import { voteValidator } from '../../validators/polls'

describe('voteValidator — rama aporte', () => {
  it('rechaza un aporte que solo tiene espacios', () => {
    const res = voteValidator.safeParse({ pollId: 'p', tipo: 'aporte', aporte: '   ' })
    expect(res.success).toBe(false)
  })

  it('rechaza un aporte de 1401 caracteres', () => {
    const res = voteValidator.safeParse({ pollId: 'p', tipo: 'aporte', aporte: 'a'.repeat(1401) })
    expect(res.success).toBe(false)
  })

  it('acepta un aporte válido de 1 carácter', () => {
    const res = voteValidator.safeParse({ pollId: 'p', tipo: 'aporte', aporte: 'x' })
    expect(res.success).toBe(true)
  })

  it('acepta un aporte de 1400 caracteres', () => {
    const res = voteValidator.safeParse({ pollId: 'p', tipo: 'aporte', aporte: 'a'.repeat(1400) })
    expect(res.success).toBe(true)
  })

  it('sigue aceptando el voto tipo opcion', () => {
    const res = voteValidator.safeParse({ pollId: 'p', tipo: 'opcion', optionId: '0' })
    expect(res.success).toBe(true)
  })
})
