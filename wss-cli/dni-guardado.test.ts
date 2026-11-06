import { afterEach, beforeEach, describe, expect, it, setSystemTime } from 'bun:test'
import { borrarDni, guardarDni, leerDni, limpiarDnisVencidos } from './dni-guardado'

const HORA = 60 * 60 * 1000
const AHORA = new Date('2026-01-01T12:00:00Z')

beforeEach(() => {
  localStorage.clear()
  setSystemTime(AHORA)
})

afterEach(() => {
  setSystemTime()
  localStorage.clear()
})

const avanzar = (ms: number) => setSystemTime(new Date(Date.now() + ms))

describe('dni guardado', () => {
  it('guardar y leer devuelve el DNI antes de las 24 horas', () => {
    guardarDni('a', '12345678')
    avanzar(24 * HORA - 1)
    expect(leerDni('a')).toBe('12345678')
  })

  it('pasadas las 24 horas devuelve null y borra la clave', () => {
    guardarDni('a', '12345678')
    avanzar(24 * HORA)
    expect(leerDni('a')).toBeNull()
    expect(localStorage.getItem('encuestas-dni-a')).toBeNull()
  })

  it('leer no extiende el vencimiento', () => {
    guardarDni('a', '12345678')
    avanzar(23 * HORA)
    expect(leerDni('a')).toBe('12345678')
    avanzar(2 * HORA)
    expect(leerDni('a')).toBeNull()
  })

  it('volver a guardar renueva el plazo', () => {
    guardarDni('a', '12345678')
    avanzar(23 * HORA)
    guardarDni('a', '12345678')
    avanzar(2 * HORA)
    expect(leerDni('a')).toBe('12345678')
  })

  it('un texto plano o un JSON inválido devuelve null y se borra', () => {
    for (const valor of ['12345678', '{roto', '{"dni":1,"expira":"x"}', 'null']) {
      localStorage.setItem('encuestas-dni-a', valor)
      expect(leerDni('a')).toBeNull()
      expect(localStorage.getItem('encuestas-dni-a')).toBeNull()
    }
  })

  it('borrarDni elimina la clave', () => {
    guardarDni('a', '12345678')
    borrarDni('a')
    expect(leerDni('a')).toBeNull()
  })

  it('limpiarDnisVencidos borra vencidos e inválidos, conserva vigentes y no toca otros prefijos', () => {
    guardarDni('vencida', '1')
    avanzar(12 * HORA)
    guardarDni('vigente', '2')
    avanzar(13 * HORA)
    localStorage.setItem('encuestas-dni-plano', '33333333')
    localStorage.setItem('encuestas-nombre-vencida', 'Ana')

    limpiarDnisVencidos()

    expect(localStorage.getItem('encuestas-dni-vencida')).toBeNull()
    expect(localStorage.getItem('encuestas-dni-plano')).toBeNull()
    expect(leerDni('vigente')).toBe('2')
    expect(localStorage.getItem('encuestas-nombre-vencida')).toBe('Ana')
  })
})
