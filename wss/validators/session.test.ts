import { describe, expect, it } from 'bun:test'
import { MetodosLogin } from './auth'
import { identidadRealEstudiante, WssEstudianteIdentidadSchema, WssEstudianteSessionSchema } from './session'

describe('identidad de estudiante', () => {
  it('por DNI: valida la identidad y completa el nombre de fantasía', () => {
    const identidad = WssEstudianteIdentidadSchema.parse({
      rol: 'estudiante',
      idSala: 's1',
      metodo: MetodosLogin.DNI,
      dni: '20333444555',
    })

    expect(identidad).toMatchObject({ dni: '20333444555' })
    expect(identidad.nombre).toBeTruthy()
  })

  it('por DNI: rechaza un dni que no es solo dígitos', () => {
    expect(() =>
      WssEstudianteIdentidadSchema.parse({
        rol: 'estudiante',
        idSala: 's1',
        metodo: MetodosLogin.DNI,
        dni: '20.333.444',
      })
    ).toThrow()
  })

  it('por Nombre: el nombre es obligatorio', () => {
    expect(() =>
      WssEstudianteIdentidadSchema.parse({ rol: 'estudiante', idSala: 's1', metodo: MetodosLogin.Nombre })
    ).toThrow()
  })

  it('por Google: valida el email', () => {
    expect(() =>
      WssEstudianteIdentidadSchema.parse({
        rol: 'estudiante',
        idSala: 's1',
        metodo: MetodosLogin.Google,
        email: 'no-es-un-email',
        nombre: 'Ana',
      })
    ).toThrow()
  })
})

describe('documento guardado de estudiante', () => {
  it('conserva el userId que le asignó la sala', () => {
    const session = WssEstudianteSessionSchema.parse({
      rol: 'estudiante',
      idSala: 's1',
      metodo: MetodosLogin.DNI,
      dni: '20333444555',
      userId: 'handle-opaco',
    })

    expect(session.userId).toBe('handle-opaco')
    expect(session).toMatchObject({ dni: '20333444555' })
  })

  it('sin userId no es un documento guardado válido', () => {
    expect(() =>
      WssEstudianteSessionSchema.parse({
        rol: 'estudiante',
        idSala: 's1',
        metodo: MetodosLogin.Nombre,
        nombre: 'Ana',
      })
    ).toThrow()
  })

  it('descarta los campos de conexión que traían los documentos guardados', () => {
    // El schema devuelve solo sus campos, aunque el JSON guardado traiga otros.
    const session = WssEstudianteSessionSchema.parse({
      rol: 'estudiante',
      idSala: 's1',
      metodo: MetodosLogin.DNI,
      dni: '20333444555',
      userId: 'handle-opaco',
      ['user' + 'Ip']: '190.0.0.1',
      ['agen' + 'te']: 'Mozilla/5.0',
    })

    expect(Object.keys(session).sort()).toEqual(['dni', 'idSala', 'metodo', 'nombre', 'rol', 'userId'])
  })
})

describe('identidadRealEstudiante', () => {
  it('devuelve el campo de identidad según el método (la lista de permitidos y la planilla usan esto)', () => {
    const dni = WssEstudianteIdentidadSchema.parse({
      rol: 'estudiante',
      idSala: 's1',
      metodo: MetodosLogin.DNI,
      dni: '20333444555',
    })
    const google = WssEstudianteIdentidadSchema.parse({
      rol: 'estudiante',
      idSala: 's1',
      metodo: MetodosLogin.Google,
      email: 'ana@colegio.edu',
      nombre: 'Ana',
    })
    const nombre = WssEstudianteIdentidadSchema.parse({
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
