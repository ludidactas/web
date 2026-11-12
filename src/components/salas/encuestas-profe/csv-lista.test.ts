import { describe, expect, test } from 'bun:test'
import { MetodosLogin } from '@/wss/validators/auth'
import { entradaValida, parsearCSV } from './csv-lista'

describe('parsearCSV', () => {
  test('DNI con encabezado, columnas en cualquier orden y separador ;', () => {
    const { entradas } = parsearCSV('Nombre;DNI\nAna Gómez;12.345.678\nBeto;40111222', MetodosLogin.DNI)
    expect(entradas).toEqual([
      { identidad: '12345678', nombre: 'Ana Gómez' },
      { identidad: '40111222', nombre: 'Beto' },
    ])
  })

  test('DNI sin encabezado: primera columna identidad, segunda nombre', () => {
    expect(parsearCSV('123,Zoe\n456', MetodosLogin.DNI).entradas).toEqual([
      { identidad: '123', nombre: 'Zoe' },
      { identidad: '456', nombre: undefined },
    ])
  })

  test('email: normaliza y descarta lo que no es un email', () => {
    const { entradas, descartadas } = parsearCSV('email,nombre\nAna@X.com,Ana\nno-es-email,Beto', MetodosLogin.Google)
    expect(entradas).toEqual([{ identidad: 'ana@x.com', nombre: 'Ana' }])
    expect(descartadas).toEqual(['no-es-email'])
  })

  test('nombre: la columna `nombre` es la identidad y `nombre real` el nombre provisto', () => {
    const { entradas } = parsearCSV('nombre real,nombre\nAna García,ana01\nBeto Ruiz,beto02', MetodosLogin.Nombre)
    expect(entradas).toEqual([
      { identidad: 'ana01', nombre: 'Ana García' },
      { identidad: 'beto02', nombre: 'Beto Ruiz' },
    ])
  })

  test('archivo vacío', () => {
    expect(parsearCSV('  \n', MetodosLogin.DNI)).toEqual({ entradas: [], descartadas: [] })
  })
})

describe('entradaValida', () => {
  test('DNI ignora puntos y espacios', () => {
    expect(entradaValida(MetodosLogin.DNI, '12.345 678')).toBe('12345678')
    expect(entradaValida(MetodosLogin.DNI, 'abc')).toBeNull()
  })
})
