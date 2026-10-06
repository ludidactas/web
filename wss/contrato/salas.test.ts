import { describe, expect, test } from 'bun:test'
import { comandosSalaActivaProfe, comandosSalasGestion } from './salas'

describe('contrato de salas', () => {
  const crear = comandosSalasGestion['sala:crear'].input

  test('sala:crear completa la config por defecto, con o sin payload', () => {
    for (const payload of [undefined, {}, { config: {} }]) {
      expect(crear.parse(payload).config).toMatchObject({ metodo_login: 'nombre', solo_invitados: false, listaPermitidos: [] })
    }
  })

  test('sala:crear conserva lo que manda el profe', () => {
    const { config } = crear.parse({ config: { nombre: 'Clase', solo_invitados: true, listaPermitidos: ['123'] } })
    expect(config).toMatchObject({ nombre: 'Clase', solo_invitados: true, listaPermitidos: ['123'] })
  })

  test('sala:actualizar_config solo admite los campos mutables', () => {
    const input = comandosSalaActivaProfe['sala:actualizar_config'].input
    expect(input.parse({ solo_invitados: true })).toEqual({ solo_invitados: true })
    expect(() => input.parse({ metodo_login: 'dni' })).toThrow()
  })

  test('sala:pedir_planilla_completa acepta los minutos o nada', () => {
    const input = comandosSalaActivaProfe['sala:pedir_planilla_completa'].input
    expect(input.parse(undefined)).toBeUndefined()
    expect(input.parse(90)).toBe(90)
    expect(() => input.parse('90')).toThrow()
  })
})
