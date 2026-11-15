import { describe, expect, it } from 'bun:test'
import { MetodosLogin } from '../../validators/auth'
import { claveDeIdentidad, normalizarIdentidad, prepararLista } from '../identidad'

describe('normalizarIdentidad', () => {
  it('DNI: solo dígitos', () => {
    expect(normalizarIdentidad(MetodosLogin.DNI, ' 12345678 ')).toBe('12345678')
    expect(() => normalizarIdentidad(MetodosLogin.DNI, '12.345.678')).toThrow()
    expect(() => normalizarIdentidad(MetodosLogin.DNI, '')).toThrow()
  })

  it('email: minúsculas y con forma de email', () => {
    expect(normalizarIdentidad(MetodosLogin.Google, ' Ana@Colegio.EDU ')).toBe('ana@colegio.edu')
    expect(() => normalizarIdentidad(MetodosLogin.Google, 'ana')).toThrow()
  })

  it('nombre: conserva mayúsculas y tildes, colapsa espacios', () => {
    expect(normalizarIdentidad(MetodosLogin.Nombre, '  José   Pérez ')).toBe('José Pérez')
    expect(() => normalizarIdentidad(MetodosLogin.Nombre, '   ')).toThrow()
    expect(() => normalizarIdentidad(MetodosLogin.Nombre, 'x'.repeat(51))).toThrow()
  })
})

describe('claveDeIdentidad', () => {
  it('los nombres se comparan sin tildes ni mayúsculas', () => {
    expect(claveDeIdentidad(MetodosLogin.Nombre, 'José  PÉREZ')).toBe(
      claveDeIdentidad(MetodosLogin.Nombre, 'jose perez')
    )
  })

  it('los emails se comparan en minúsculas (el email del token puede venir con mayúsculas)', () => {
    expect(claveDeIdentidad(MetodosLogin.Google, 'Ana@X.com')).toBe('ana@x.com')
  })
})

describe('prepararLista', () => {
  it('unifica repetidos por clave y normaliza la info', () => {
    const { lista, info } = prepararLista(MetodosLogin.Nombre, ['Ana', ' ana ', 'Beto'], {
      ANA: { nombre: '  Ana García ' },
    })
    expect(lista).toEqual(['Ana', 'Beto'])
    expect(info).toEqual({ Ana: { nombre: 'Ana García' } })
  })

  it('rechaza todo el lote si alguna entrada es inválida, con el detalle', () => {
    expect(() => prepararLista(MetodosLogin.DNI, ['123', 'abc', '456', 'x1'])).toThrow(/abc, x1/)
  })

  it('rechaza info para algo que no está en la lista', () => {
    expect(() => prepararLista(MetodosLogin.DNI, ['123'], { '999': { nombre: 'Zoe' } })).toThrow(/no está en la lista/)
  })

  it('descarta la info vacía', () => {
    expect(prepararLista(MetodosLogin.DNI, ['123'], { '123': { nombre: '   ' } }).info).toEqual({})
  })
})
