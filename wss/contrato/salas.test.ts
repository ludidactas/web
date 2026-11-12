import { describe, expect, test } from 'bun:test'
import { comandosSalaActivaProfe, comandosSalasGestion } from './salas'

describe('contrato de salas', () => {
  const crear = comandosSalasGestion['sala:crear'].input

  test('sala:crear completa la config por defecto, con o sin payload', () => {
    for (const payload of [undefined, {}, { config: {} }]) {
      expect(crear.parse(payload).config).toMatchObject({
        metodo_login: 'nombre',
        acceso: 'libre',
        listaPermitidos: [],
      })
    }
  })

  test('sala:crear conserva lo que manda el profe', () => {
    const { config } = crear.parse({ config: { nombre: 'Clase', metodo_login: 'dni', acceso: 'lista', listaPermitidos: ['123'] } })
    expect(config).toMatchObject({ nombre: 'Clase', metodo_login: 'dni', acceso: 'lista', listaPermitidos: ['123'] })
  })

  test('sala:actualizar_config solo admite los campos mutables', () => {
    const input = comandosSalaActivaProfe['sala:actualizar_config'].input
    expect(input.parse({ nombre: 'Otro nombre' })).toEqual({ nombre: 'Otro nombre' })
    expect(() => input.parse({ metodo_login: 'dni' })).toThrow()
    expect(() => input.parse({ acceso: 'lista' })).toThrow()
  })

  test('sala:pedir_planilla_completa acepta los minutos o nada', () => {
    const input = comandosSalaActivaProfe['sala:pedir_planilla_completa'].input
    expect(input.parse(undefined)).toBeUndefined()
    expect(input.parse(90)).toBe(90)
    expect(() => input.parse('90')).toThrow()
  })
})
