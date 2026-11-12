import { describe, expect, it } from 'bun:test'
import { MetodosLogin } from './auth'
import { WssEstudianteSessionSchema } from './session'

describe('sesión de estudiante', () => {
  it('descarta los campos de conexión que traían los documentos guardados', () => {
    // El schema devuelve solo sus campos, aunque el JSON guardado traiga otros.
    const session = WssEstudianteSessionSchema.parse({
      rol: 'estudiante',
      idSala: 's1',
      metodo: MetodosLogin.DNI,
      dni: '20333444555',
      ['user' + 'Ip']: '190.0.0.1',
      ['agen' + 'te']: 'Mozilla/5.0',
    })

    expect(Object.keys(session).sort()).toEqual(['dni', 'idSala', 'metodo', 'nombre', 'rol', 'userId'])
  })
})
