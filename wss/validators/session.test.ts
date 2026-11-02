import { describe, expect, it } from 'bun:test'
import { idOpaco } from '../id-opaco'
import { MetodosLogin } from './auth'
import {
  identidadRealEstudiante,
  WssEstudianteDniSessionSchema,
  WssEstudianteGoogleSessionSchema,
  WssEstudianteNombreSessionSchema,
} from './session'

describe('sesión de estudiante', () => {
  it('por DNI: el userId es el id opaco por sala y el dni queda en la sesión', () => {
    const session = WssEstudianteDniSessionSchema.parse({
      rol: 'estudiante',
      idSala: 's1',
      metodo: MetodosLogin.DNI,
      dni: '20333444555',
    })

    expect(session.userId).toBe(idOpaco('s1', '20333444555'))
    expect(session.dni).toBe('20333444555')
  })

  it('por Nombre: el userId es el id opaco por sala', () => {
    const session = WssEstudianteNombreSessionSchema.parse({
      rol: 'estudiante',
      idSala: 's1',
      metodo: MetodosLogin.Nombre,
      nombre: 'Ana',
    })

    expect(session.userId).toBe(idOpaco('s1', 'Ana'))
    expect(session.userId).not.toBe('Ana')
  })

  it('por Google: el userId es el id opaco por sala del email', () => {
    const session = WssEstudianteGoogleSessionSchema.parse({
      rol: 'estudiante',
      idSala: 's1',
      metodo: MetodosLogin.Google,
      email: 'ana@colegio.edu',
      nombre: 'Ana',
    })

    expect(session.userId).toBe(idOpaco('s1', 'ana@colegio.edu'))
    expect(session.userId).not.toContain('@')
  })

  it('el mismo dni en dos salas da userIds distintos', () => {
    const enA = WssEstudianteDniSessionSchema.parse({
      rol: 'estudiante',
      idSala: 'sala-a',
      metodo: MetodosLogin.DNI,
      dni: '20333444555',
    })
    const enB = WssEstudianteDniSessionSchema.parse({
      rol: 'estudiante',
      idSala: 'sala-b',
      metodo: MetodosLogin.DNI,
      dni: '20333444555',
    })

    expect(enA.userId).not.toBe(enB.userId)
  })
})

describe('identidadRealEstudiante', () => {
  it('devuelve el campo de identidad según el método (la lista de permitidos y la planilla usan esto)', () => {
    const dni = WssEstudianteDniSessionSchema.parse({
      rol: 'estudiante',
      idSala: 's1',
      metodo: MetodosLogin.DNI,
      dni: '20333444555',
    })
    const google = WssEstudianteGoogleSessionSchema.parse({
      rol: 'estudiante',
      idSala: 's1',
      metodo: MetodosLogin.Google,
      email: 'ana@colegio.edu',
      nombre: 'Ana',
    })
    const nombre = WssEstudianteNombreSessionSchema.parse({
      rol: 'estudiante',
      idSala: 's1',
      metodo: MetodosLogin.Nombre,
      nombre: 'Ana',
    })

    expect(identidadRealEstudiante(dni)).toBe('20333444555')
    expect(identidadRealEstudiante(google)).toBe('ana@colegio.edu')
    expect(identidadRealEstudiante(nombre)).toBe('Ana')
  })
})
